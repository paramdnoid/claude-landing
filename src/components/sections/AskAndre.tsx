import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Send, Sparkles } from 'lucide-react';
import { prefersReducedMotion, splitText } from '../../lib/animations';
import { isLiveBackend, sendChat, type ChatMessage } from '../../lib/chatBackend';

gsap.registerPlugin(ScrollTrigger);

type QuickReply = {
  id: string;
  label: string;
  userText: string;
  response: string;
  ctaLabel: string;
};

type Bubble = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  cta?: { label: string };
};

const CONTACT_EMAIL =
  (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ?? 'hello@zian-ai.dev';

export default function AskAndre() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleAccentRef = useRef<HTMLSpanElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickReplies = t('ask.quickReplies', { returnObjects: true }) as QuickReply[];
  const live = isLiveBackend();

  const [bubbles, setBubbles] = useState<Bubble[]>([
    { id: 'welcome', role: 'assistant', text: t('ask.welcome') },
  ]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [quickRepliesVisible, setQuickRepliesVisible] = useState(true);

  // Reset welcome on language switch
  useEffect(() => {
    setBubbles([{ id: 'welcome', role: 'assistant', text: t('ask.welcome') }]);
    setQuickRepliesVisible(true);
  }, [i18n.language, t]);

  // Section reveal animations
  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      const reduced = prefersReducedMotion();
      if (titleRef.current) {
        const charsA = splitText(titleRef.current);
        const charsB = titleAccentRef.current ? splitText(titleAccentRef.current) : [];
        if (reduced) {
          gsap.set([...charsA, ...charsB], { y: 0, opacity: 1 });
        } else {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: titleRef.current, start: 'top 85%', once: true },
          });
          tl.fromTo(
            charsA,
            { yPercent: 110, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.016 },
          );
          if (charsB.length) {
            tl.fromTo(
              charsB,
              { yPercent: 110, opacity: 0 },
              { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.016 },
              '-=0.65',
            );
          }
        }
      }
      if (ledeRef.current) {
        if (reduced) {
          gsap.set(ledeRef.current, { opacity: 1, y: 0 });
        } else {
          gsap.fromTo(
            ledeRef.current,
            { y: 24, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: { trigger: ledeRef.current, start: 'top 85%', once: true },
            },
          );
        }
      }
      if (cardRef.current) {
        if (reduced) {
          gsap.set(cardRef.current, { opacity: 1, y: 0 });
        } else {
          gsap.fromTo(
            cardRef.current,
            { y: 60, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1.1,
              ease: 'power3.out',
              scrollTrigger: { trigger: cardRef.current, start: 'top 82%', once: true },
            },
          );
        }
      }
    }, sectionRef);
    return () => ctx.revert();
  }, [i18n.language]);

  // Keep new bubbles in view
  useLayoutEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [bubbles, thinking]);

  function pushBubble(b: Bubble) {
    setBubbles((prev) => [...prev, b]);
  }

  async function handleQuickReply(qr: QuickReply) {
    if (thinking) return;
    setQuickRepliesVisible(false);
    pushBubble({ id: `u-${qr.id}-${Date.now()}`, role: 'user', text: qr.userText });
    setThinking(true);
    await wait(reduced() ? 50 : 650);
    pushBubble({
      id: `a-${qr.id}-${Date.now()}`,
      role: 'assistant',
      text: qr.response,
      cta: { label: qr.ctaLabel },
    });
    setThinking(false);
  }

  async function handleFreeForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || thinking) return;
    setQuickRepliesVisible(false);
    setDraft('');
    const userBubble: Bubble = { id: `u-${Date.now()}`, role: 'user', text };
    pushBubble(userBubble);
    setThinking(true);

    if (live) {
      const history: ChatMessage[] = [
        ...bubbles.map((b) => ({ role: b.role, content: b.text }) as ChatMessage),
        { role: 'user', content: text },
      ];
      const replyId = `a-${Date.now()}`;
      let acc = '';
      pushBubble({ id: replyId, role: 'assistant', text: '' });
      try {
        await sendChat(history, (i18n.language === 'de' ? 'de' : 'en'), (chunk) => {
          acc += chunk;
          setBubbles((prev) =>
            prev.map((b) => (b.id === replyId ? { ...b, text: acc } : b)),
          );
        });
      } catch {
        setBubbles((prev) =>
          prev.map((b) => (b.id === replyId ? { ...b, text: t('ask.freeFormResponse') } : b)),
        );
      }
    } else {
      await wait(reduced() ? 50 : 700);
      pushBubble({
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: t('ask.freeFormResponse'),
      });
    }
    setThinking(false);
  }

  return (
    <section
      ref={sectionRef}
      id="ask"
      aria-label="Ask my AI assistant"
      className="relative mx-auto max-w-7xl px-6 py-32 lg:px-12 lg:py-40"
    >

      <div className="max-w-4xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-cyan">
          {t('ask.eyebrow')}
        </span>
        <h2
          ref={titleRef}
          className="mt-5 font-display text-[clamp(2rem,7vw,6rem)] leading-[0.95] tracking-[-0.04em] text-white"
        >
          {t('ask.title')}{' '}
          <span ref={titleAccentRef} className="text-gradient">
            {t('ask.titleAccent')}
          </span>
        </h2>
        <p
          ref={ledeRef}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-muted"
        >
          {t('ask.lede')}
        </p>
      </div>

      {/* Chat card */}
      <div
        ref={cardRef}
        className="relative mx-auto mt-12 max-w-3xl lg:mt-16"
      >
        <div className="premium-card relative overflow-hidden">
          {/* Header */}
          <div className="relative flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/4">
                <Sparkles size={14} strokeWidth={1.75} className="text-accent-cyan" aria-hidden="true" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-medium text-white">{t('ask.statusLabel')}</span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300/80">
                  <span className="relative inline-flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  </span>
                  {t('ask.statusOnline')}
                </span>
              </div>
            </div>
            <span
              className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] ${
                live
                  ? 'border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan'
                  : 'border-accent-violet/40 bg-accent-violet/10 text-white/80'
              }`}
            >
              {live ? 'ollama' : t('ask.demoBadge')}
            </span>
          </div>

          {/* Messages */}
          <div
            ref={messagesRef}
            data-lenis-prevent
            className="relative max-h-[440px] min-h-[280px] overflow-y-auto px-5 py-6 [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin]"
          >
            <ul className="flex flex-col gap-3">
              {bubbles.map((b) => (
                <li
                  key={b.id}
                  className={`flex w-full ${b.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={b.role === 'user' ? 'max-w-[85%]' : 'max-w-[90%]'}>
                    <div
                      className={`relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed transition-opacity duration-300 ${
                        b.role === 'user'
                          ? 'rounded-tr-sm bg-white/12 text-white/95'
                          : 'rounded-tl-sm border border-white/8 bg-linear-to-br from-accent-cyan/12 to-accent-violet/12 text-white/95'
                      }`}
                    >
                      {b.text || <span className="opacity-50">…</span>}
                    </div>
                    {b.cta && (
                      <a
                        href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
                          'ZIAN AI Concepts — Anfrage',
                        )}&body=${encodeURIComponent(b.text)}`}
                        data-cursor="hover"
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent-cyan/40 bg-accent-cyan/8 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-accent-cyan transition-all hover:-translate-y-0.5 hover:border-accent-cyan/70 hover:shadow-[0_0_18px_rgba(0,229,255,0.35)]"
                      >
                        {b.cta.label}
                        <ArrowUpRight size={12} strokeWidth={2} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
              {thinking && (
                <li className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-sm border border-white/8 bg-white/4 px-4 py-2.5 text-sm">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-[bounce_1s_ease-in-out_infinite] rounded-full bg-white/70" />
                      <span className="h-1.5 w-1.5 animate-[bounce_1s_ease-in-out_infinite_0.15s] rounded-full bg-white/70" />
                      <span className="h-1.5 w-1.5 animate-[bounce_1s_ease-in-out_infinite_0.3s] rounded-full bg-white/70" />
                    </span>
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
                      {t('ask.thinking')}
                    </span>
                  </div>
                </li>
              )}
            </ul>
          </div>

          {/* Quick replies */}
          {quickRepliesVisible && (
            <div className="border-t border-white/8 px-5 pb-2 pt-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {quickReplies.map((qr) => (
                  <button
                    key={qr.id}
                    type="button"
                    onClick={() => handleQuickReply(qr)}
                    data-cursor="hover"
                    className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/3 px-3.5 py-2.5 text-left text-sm text-white/85 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-cyan/50 hover:bg-accent-cyan/8 hover:text-white hover:shadow-[0_0_18px_rgba(0,229,255,0.2)]"
                  >
                    <span>{qr.label}</span>
                    <ArrowUpRight
                      size={14}
                      strokeWidth={1.6}
                      className="shrink-0 opacity-50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 group-hover:text-accent-cyan"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleFreeForm}
            className="relative border-t border-white/8 p-3"
          >
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-bg/60 px-3 py-2 transition-colors focus-within:border-accent-cyan/60 focus-within:shadow-[0_0_0_3px_rgba(0,229,255,0.12)]">
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t('ask.placeholder')}
                aria-label={t('ask.placeholder')}
                disabled={thinking}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-muted-2 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={thinking || !draft.trim()}
                aria-label={t('ask.send')}
                data-cursor="hover"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-accent-cyan to-accent-violet text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(0,229,255,0.45)] disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <Send size={14} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
            {!live && (
              <p className="mt-2 px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
                {t('ask.demoNote')}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function reduced() {
  return prefersReducedMotion();
}
