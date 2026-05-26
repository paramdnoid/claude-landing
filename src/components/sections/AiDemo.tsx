import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Send, Bot, User } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };

const endpoint = import.meta.env.VITE_OLLAMA_ENDPOINT;
const model = import.meta.env.VITE_OLLAMA_MODEL ?? 'llama3.2:3b';

function pickMockReply(input: string, replies: Record<string, string>): string {
  const lower = input.toLowerCase();
  if (/preis|cost|price|kost|budget|quote/.test(lower)) return replies.pricing;
  if (/kurs|course|train|workshop|teach|lehr/.test(lower)) return replies.courses;
  if (/integ|implement|company|firma|smb|mittelstand|enterprise/.test(lower)) return replies.integration;
  if (/zeit|timeline|long|dauer|wie lange|how long/.test(lower)) return replies.timeline;
  if (/^(hi|hello|hey|hallo|moin|servus)\b/.test(lower)) return replies.hello;
  return replies.fallback;
}

export default function AiDemo() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const greeted = useRef(false);

  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    const greeting = t('aiDemo.greeting');
    setMessages([{ role: 'assistant', content: greeting }]);
  }, [t]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function streamMock(reply: string) {
    setMessages((m) => [...m, { role: 'assistant', content: '' }]);
    const tokens = reply.split(/(\s+)/);
    for (const tok of tokens) {
      await new Promise((r) => setTimeout(r, 30 + Math.random() * 40));
      setMessages((m) => {
        const copy = m.slice();
        copy[copy.length - 1] = {
          role: 'assistant',
          content: copy[copy.length - 1].content + tok,
        };
        return copy;
      });
    }
  }

  async function streamOllama(history: Msg[]) {
    setMessages((m) => [...m, { role: 'assistant', content: '' }]);
    try {
      const res = await fetch(`${endpoint!.replace(/\/$/, '')}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      });
      if (!res.ok || !res.body) throw new Error('bad response');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            const chunk: string = json.message?.content ?? '';
            if (chunk) {
              setMessages((m) => {
                const copy = m.slice();
                copy[copy.length - 1] = {
                  role: 'assistant',
                  content: copy[copy.length - 1].content + chunk,
                };
                return copy;
              });
            }
          } catch {
            /* swallow malformed line */
          }
        }
      }
    } catch {
      setMessages((m) => {
        const copy = m.slice();
        copy[copy.length - 1] = { role: 'assistant', content: t('aiDemo.error') };
        return copy;
      });
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = input.trim();
    if (!value || streaming) return;
    setInput('');
    const next: Msg[] = [...messages, { role: 'user', content: value }];
    setMessages(next);
    setStreaming(true);
    if (endpoint) {
      await streamOllama(next);
    } else {
      const replies = t('aiDemo.replies', { returnObjects: true }) as unknown as Record<string, string>;
      await streamMock(pickMockReply(value, replies));
    }
    setStreaming(false);
  }

  const suggestions = t('aiDemo.suggestions', { returnObjects: true }) as string[];

  return (
    <div id="ai-demo" className="mt-32">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-accent-violet)]">
            {t('aiDemo.eyebrow')}
          </span>
          <h3 className="mt-3 font-display text-3xl leading-tight text-white md:text-4xl">
            {t('aiDemo.title')}
          </h3>
          <p className="mt-3 text-[var(--color-muted)]">{t('aiDemo.lede')}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted)] backdrop-blur">
          <Sparkles size={12} className="text-[var(--color-accent-cyan)]" />
          {endpoint ? `Live · ${model}` : t('aiDemo.poweredBy')}
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[var(--color-bg-elev)]/80 backdrop-blur">
        <div
          ref={scrollRef}
          className="max-h-[26rem] min-h-[18rem] space-y-4 overflow-y-auto p-6 md:p-8"
          aria-live="polite"
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse text-right' : ''}`}
            >
              <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                  m.role === 'user'
                    ? 'border-white/20 bg-white/[0.05] text-white'
                    : 'border-transparent bg-gradient-to-br from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] text-[var(--color-bg)]'
                }`}
              >
                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </span>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-white/[0.06] text-white'
                    : 'bg-[var(--color-bg)]/60 text-[var(--color-fg)]'
                }`}
              >
                {m.content || (
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent-cyan)]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent-cyan)] [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent-cyan)] [animation-delay:240ms]" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-white/5 px-6 py-3 md:px-8">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setInput(s)}
              disabled={streaming}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent-cyan)]/50 hover:text-white disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-white/5 p-3 md:p-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('aiDemo.placeholder')}
            disabled={streaming}
            aria-label={t('aiDemo.placeholder')}
            className="flex-1 rounded-full border border-white/10 bg-[var(--color-bg)]/60 px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-accent-cyan)] focus:shadow-[0_0_0_3px_rgba(0,229,255,0.18)]"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            aria-label={t('aiDemo.send')}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] text-[var(--color-bg)] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
