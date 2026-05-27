import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { sendChat, isLiveBackend, type ChatMessage } from '../../lib/chatBackend';
import { prefersReducedMotion } from '../../lib/animations';

type Status = 'idle' | 'streaming' | 'error' | 'stopped';

const OLLAMA_MODEL = (import.meta.env.VITE_OLLAMA_MODEL as string | undefined) ?? 'llama3.2:3b';
const liveMode = isLiveBackend();

export default function AiDemo() {
  const { t, i18n } = useTranslation();
  const lang: 'de' | 'en' = i18n.language.startsWith('en') ? 'en' : 'de';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [streamBuffer, setStreamBuffer] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const reduceMotion = prefersReducedMotion();

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, streamBuffer]);

  // Abort any in-flight stream on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const getMockReply = useCallback((userMsg: string): string => {
    const suggestions = t('aiDemo.suggestions', { returnObjects: true }) as string[];
    const replies = t('aiDemo.mock.replies', { returnObjects: true }) as string[];
    const fallback = t('aiDemo.mock.fallback');
    const idx = suggestions.findIndex((s) => s.toLowerCase() === userMsg.toLowerCase());
    if (idx >= 0 && idx < replies.length) return replies[idx] ?? fallback;
    return fallback;
  }, [t]);

  const streamMock = useCallback(async (reply: string, signal: AbortSignal): Promise<void> => {
    if (reduceMotion) {
      setStreamBuffer(reply);
      return;
    }
    setStreamBuffer('');
    for (const char of reply) {
      if (signal.aborted) return;
      setStreamBuffer((prev) => prev + char);
      await new Promise<void>((r) => setTimeout(r, 18));
    }
  }, [reduceMotion]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || status === 'streaming') return;

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setStreamBuffer('');
    setStatus('streaming');

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      if (liveMode) {
        let full = '';
        await sendChat([...messages, userMsg], lang, (chunk) => {
          if (abort.signal.aborted) return;
          full += chunk;
          setStreamBuffer(full);
        }, abort.signal);
        if (!abort.signal.aborted) {
          setMessages((prev) => [...prev, { role: 'assistant', content: full }]);
          setStreamBuffer('');
          setStatus('idle');
        }
      } else {
        const reply = getMockReply(trimmed);
        await streamMock(reply, abort.signal);
        if (!abort.signal.aborted) {
          setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
          setStreamBuffer('');
          setStatus('idle');
        }
      }
    } catch (err) {
      if ((err as Error).message === 'mock-mode' || abort.signal.aborted) return;
      setStatus('error');
    }
  }, [status, messages, lang, getMockReply, streamMock]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (streamBuffer) {
      setMessages((prev) => [...prev, { role: 'assistant', content: streamBuffer }]);
    }
    setStreamBuffer('');
    setStatus('stopped');
  }, [streamBuffer]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamBuffer('');
    setInput('');
    setStatus('idle');
    inputRef.current?.focus();
  }, []);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const suggestions = t('aiDemo.suggestions', { returnObjects: true }) as string[];

  return (
    <section id="ai-demo" className="relative px-6 py-32 md:px-10 md:py-48">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="tag mb-4">{t('aiDemo.eyebrow')}</div>
            <h2 className="font-display text-display-lg">{t('aiDemo.title')}</h2>
            <p className="lead mt-4 max-w-xl text-[var(--color-fg)]/75">{t('aiDemo.intro')}</p>
          </div>
          {/* Mode badge */}
          <div className="flex items-center gap-3">
            {liveMode ? (
              <>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-plasma-lime)] glow-lime" />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  {t('aiDemo.poweredBy')} · {OLLAMA_MODEL}
                </span>
              </>
            ) : (
              <>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]" />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  {t('aiDemo.demoMode')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Terminal panel */}
        <div className="glass rounded-2xl border border-[var(--color-border-strong)] overflow-hidden">
          {/* Terminal chrome */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/60" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <span className="h-3 w-3 rounded-full bg-green-500/60" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
              {t(`aiDemo.status.${status}`)}
            </span>
            <button
              type="button"
              onClick={reset}
              aria-label={t('aiDemo.controls.reset')}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
            >
              {t('aiDemo.controls.reset')}
            </button>
          </div>

          {/* Message log — aria-live region contains only committed messages so screen readers
              are not spammed on every streamed character. The in-progress streamBuffer is
              rendered in a sibling element that is aria-hidden during streaming. */}
          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-busy={status === 'streaming'}
            aria-label={t('aiDemo.title')}
            className="h-72 overflow-y-auto p-5 font-mono text-sm"
          >
            {messages.length === 0 && !streamBuffer && (
              <p className="text-[var(--color-muted)]">
                <span className="text-[var(--color-plasma-lime)]">→</span> {t('aiDemo.status.idle')}
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-3 ${msg.role === 'user' ? 'text-[var(--color-fg)]' : 'text-[var(--color-fg)]/80'}`}
              >
                <span
                  className={`mr-2 select-none ${msg.role === 'user' ? 'text-[var(--color-plasma-lime)]' : 'text-[var(--color-muted)]'}`}
                >
                  {msg.role === 'user' ? '>' : '//'}
                </span>
                {msg.content}
              </div>
            ))}
            {/* In-progress stream rendered inside the scroll container but outside aria-live
                by using aria-hidden; committed to messages[] on completion or stop. */}
            {streamBuffer && (
              <div aria-hidden="true" className="mb-3 text-[var(--color-fg)]/80">
                <span className="mr-2 select-none text-[var(--color-muted)]">//</span>
                {streamBuffer}
                {!reduceMotion && (
                  <span
                    aria-hidden="true"
                    className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-[var(--color-plasma-lime)]"
                  />
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-[var(--color-border)] px-5 py-4">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="select-none font-mono text-[var(--color-plasma-lime)]">
                {'>'}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={t('aiDemo.placeholder')}
                aria-label={t('aiDemo.placeholder')}
                disabled={status === 'streaming'}
                className="flex-1 rounded-sm bg-transparent font-mono text-sm text-[var(--color-fg)] outline-none placeholder-[var(--color-muted)] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-plasma-lime)] disabled:opacity-50"
              />
              {status === 'streaming' ? (
                <button
                  type="button"
                  onClick={stop}
                  aria-label={t('aiDemo.controls.stop')}
                  className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-muted)] transition-colors hover:text-red-400"
                >
                  {t('aiDemo.controls.stop')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void send(input)}
                  disabled={!input.trim()}
                  aria-label={t('aiDemo.controls.send')}
                  className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)] disabled:opacity-30"
                >
                  {t('aiDemo.controls.send')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {messages.length === 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => void send(s)}
                disabled={status === 'streaming'}
                className="rounded-full border border-[var(--color-border)] px-4 py-2 font-mono text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)] disabled:opacity-30"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-muted-2)]">
          {liveMode ? t('aiDemo.liveDisclaimer') : t('aiDemo.disclaimer')}
        </p>
      </div>
    </section>
  );
}
