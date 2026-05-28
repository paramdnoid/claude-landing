import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { sendChat, isLiveBackend, type ChatMessage } from '../../lib/chatBackend';
import { prefersReducedMotion, revealWordsOnScroll } from "../../lib/animations";
import { resolveLang } from "../../lib/lang";
import { useMagnet } from '../../lib/useMagnet';

type ChatStatus = 'idle' | 'streaming' | 'error' | 'stopped';
type FormStatus = 'closed' | 'open' | 'pending' | 'success' | 'error';

const OLLAMA_MODEL = (import.meta.env.VITE_OLLAMA_MODEL as string | undefined) ?? 'llama3.2:3b';
const FORM_ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT;
const liveMode = isLiveBackend();
const isDemoForm = !FORM_ENDPOINT;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTENT_RE = /(contact|email|reach|hire|work\s+together|projekt|kontakt|erreich|schreib|anfrage|zusammenarbeit)/i;

// TODO: Replace these with real social profile URLs before launch
const SOCIALS = {
  github: 'https://github.com/andrezimmermann',
  twitter: 'https://x.com/andrezimmermann',
  linkedin: 'https://www.linkedin.com/in/andrezimmermann',
} as const;

export default function Connect() {
  const { t, i18n } = useTranslation();
  const lang = resolveLang(i18n.language);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatStatus, setChatStatus] = useState<ChatStatus>('idle');
  const [streamBuffer, setStreamBuffer] = useState('');

  // Form state
  const [formStatus, setFormStatus] = useState<FormStatus>('closed');
  const [nameVal, setNameVal] = useState('');
  const [emailVal, setEmailVal] = useState('');
  const [messageVal, setMessageVal] = useState('');
  const [emailError, setEmailError] = useState('');
  const [messageError, setMessageError] = useState('');

  // Refs
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const successRef = useRef<HTMLParagraphElement>(null);
  const mailRef = useMagnet<HTMLAnchorElement>(0.25);

  const reduceMotion = prefersReducedMotion();

  // Headline scroll reveal (from Contact)
  useEffect(() => {
    if (headlineRef.current) {
      revealWordsOnScroll(headlineRef.current, { start: 'top 80%', end: 'bottom 50%', scrub: 0.6 });
    }
  }, []);

  // Cleanup: abort in-flight chat on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, streamBuffer, formStatus]);

  // Focus first form field when form opens
  useEffect(() => {
    if (formStatus === 'open') {
      // Small delay so the field is in the DOM after the same-tick state update.
      requestAnimationFrame(() => emailInputRef.current?.focus());
    }
  }, [formStatus]);

  // Focus success heading on success
  useEffect(() => {
    if (formStatus === 'success') successRef.current?.focus();
  }, [formStatus]);

  const openForm = useCallback(() => {
    setFormStatus((prev) => (prev === 'closed' || prev === 'error' ? 'open' : prev));
  }, []);

  const getMockReply = useCallback(
    (userMsg: string): string => {
      const suggestions = t('aiDemo.suggestions', { returnObjects: true }) as string[];
      const replies = t('aiDemo.mock.replies', { returnObjects: true }) as string[];
      const fallback = t('aiDemo.mock.fallback');
      const idx = suggestions.findIndex((s) => s.toLowerCase() === userMsg.toLowerCase());
      if (idx >= 0 && idx < replies.length) return replies[idx] ?? fallback;
      return fallback;
    },
    [t],
  );

  const streamMock = useCallback(
    async (reply: string, signal: AbortSignal): Promise<void> => {
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
    },
    [reduceMotion],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || chatStatus === 'streaming') return;

      const userMsg: ChatMessage = { role: 'user', content: trimmed };
      const intent = INTENT_RE.test(trimmed);
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setStreamBuffer('');
      setChatStatus('streaming');

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        if (liveMode) {
          let full = '';
          await sendChat(
            [...messages, userMsg],
            lang,
            (chunk) => {
              if (abort.signal.aborted) return;
              full += chunk;
              setStreamBuffer(full);
            },
            abort.signal,
          );
          if (!abort.signal.aborted) {
            setMessages((prev) => [...prev, { role: 'assistant', content: full }]);
            setStreamBuffer('');
            setChatStatus('idle');
            if (intent) openForm();
          }
        } else {
          const reply = getMockReply(trimmed);
          await streamMock(reply, abort.signal);
          if (!abort.signal.aborted) {
            setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
            setStreamBuffer('');
            setChatStatus('idle');
            if (intent) openForm();
          }
        }
      } catch (err) {
        if ((err as Error).message === 'mock-mode' || abort.signal.aborted) return;
        setChatStatus('error');
      }
    },
    [chatStatus, messages, lang, getMockReply, streamMock, openForm],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (streamBuffer) {
      setMessages((prev) => [...prev, { role: 'assistant', content: streamBuffer }]);
    }
    setStreamBuffer('');
    setChatStatus('stopped');
  }, [streamBuffer]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamBuffer('');
    setInput('');
    setChatStatus('idle');
    setFormStatus('closed');
    setNameVal('');
    setEmailVal('');
    setMessageVal('');
    setEmailError('');
    setMessageError('');
    inputRef.current?.focus();
  }, []);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const handleLeaveTrace = useCallback(() => {
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: t('connect.inlineFormPrompt') },
    ]);
    setFormStatus('open');
  }, [t]);

  const cancelForm = useCallback(() => {
    setFormStatus('closed');
    setEmailError('');
    setMessageError('');
  }, []);

  const validateForm = (): boolean => {
    let valid = true;
    if (!emailVal.trim() || !EMAIL_RE.test(emailVal)) {
      setEmailError(t('contact.form.invalidEmail'));
      valid = false;
    } else {
      setEmailError('');
    }
    if (!messageVal.trim()) {
      setMessageError(t('contact.form.required'));
      valid = false;
    } else {
      setMessageError('');
    }
    return valid;
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      if (!emailVal.trim() || !EMAIL_RE.test(emailVal)) emailInputRef.current?.focus();
      else if (!messageVal.trim()) messageInputRef.current?.focus();
      return;
    }
    const form = e.currentTarget;
    setFormStatus('pending');

    if (isDemoForm) {
      await new Promise((r) => setTimeout(r, 700));

      console.info('[demo] Connect form submitted:', {
        name: nameVal,
        email: emailVal,
        message: messageVal,
      });
      setFormStatus('success');
      return;
    }

    try {
      const formData = new FormData(form);
      const res = await fetch(FORM_ENDPOINT as string, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setFormStatus('success');
    } catch {
      setFormStatus('error');
    }
  };

  const resetForm = () => {
    setFormStatus('closed');
    setNameVal('');
    setEmailVal('');
    setMessageVal('');
    setEmailError('');
    setMessageError('');
  };

  const suggestions = t('aiDemo.suggestions', { returnObjects: true }) as string[];
  const formIsOpen = formStatus === 'open' || formStatus === 'pending' || formStatus === 'error';

  // Inline terminal-style input class
  const inlineInputCls =
    'flex-1 rounded-sm bg-transparent font-mono text-sm text-[var(--color-fg)] outline-none placeholder-[var(--color-muted)] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-plasma-lime)]';

  return (
    <section id="contact" className="relative px-6 pb-12 pt-16 md:px-10 md:pb-16 md:pt-24">
      {/* Backwards-compat anchor for legacy #ai-demo links */}
      <span id="ai-demo" aria-hidden="true" className="block -translate-y-24" />

      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="tag mb-6">{t('connect.eyebrow')}</div>
            <h2 ref={headlineRef} className="font-display text-display-lg">
              {t('contact.title')}
            </h2>
            <p className="lead mt-4 max-w-xl text-[var(--color-fg)]/75">{t('connect.intro')}</p>
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

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-12">
          {/* Terminal column — spans 2 */}
          <div className="lg:col-span-2">
            <div className="glass overflow-hidden rounded-2xl border border-[var(--color-border-strong)]">
              {/* Chrome */}
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/60" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <span className="h-3 w-3 rounded-full bg-green-500/60" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
                  {t(`aiDemo.status.${chatStatus}`)}
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

              {/* Log */}
              <div
                ref={logRef}
                role="log"
                aria-live="polite"
                aria-busy={chatStatus === 'streaming'}
                aria-label={t('contact.title')}
                className="h-80 overflow-y-auto p-5 font-mono text-sm"
              >
                {messages.length === 0 && !streamBuffer && formStatus === 'closed' && (
                  <p className="text-[var(--color-muted)]">
                    <span className="text-[var(--color-plasma-lime)]">→</span>{' '}
                    {t('aiDemo.status.idle')}
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

                {/* Inline form block — rendered inside the log so it feels part of the conversation */}
                {formIsOpen && (
                  <div className="mt-4 border-l-2 border-[var(--color-plasma-lime)] pl-4">
                    <form
                      onSubmit={handleFormSubmit}
                      noValidate
                      className="flex flex-col gap-3"
                    >
                      {/* Honeypot */}
                      <input
                        type="text"
                        name="_gotcha"
                        tabIndex={-1}
                        aria-hidden="true"
                        className="hidden"
                      />

                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="select-none font-mono text-[var(--color-plasma-lime)]"
                        >
                          {'>'}
                        </span>
                        <label htmlFor="connect-name" className="sr-only">
                          {t('contact.form.name')}
                        </label>
                        <input
                          id="connect-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          placeholder={t('connect.formNamePlaceholderInline')}
                          value={nameVal}
                          onChange={(e) => setNameVal(e.target.value)}
                          className={inlineInputCls}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="select-none font-mono text-[var(--color-plasma-lime)]"
                          >
                            {'>'}
                          </span>
                          <label htmlFor="connect-email" className="sr-only">
                            {t('contact.form.email')}
                          </label>
                          <input
                            ref={emailInputRef}
                            id="connect-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder={t('connect.formEmailPlaceholderInline')}
                            value={emailVal}
                            onChange={(e) => setEmailVal(e.target.value)}
                            aria-invalid={!!emailError}
                            aria-describedby={emailError ? 'connect-email-error' : undefined}
                            className={inlineInputCls}
                          />
                        </div>
                        {emailError && (
                          <p
                            id="connect-email-error"
                            role="alert"
                            className="pl-6 text-xs text-red-400"
                          >
                            {emailError}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-start gap-3">
                          <span
                            aria-hidden="true"
                            className="mt-1 select-none font-mono text-[var(--color-plasma-lime)]"
                          >
                            {'>'}
                          </span>
                          <label htmlFor="connect-message" className="sr-only">
                            {t('contact.form.message')}
                          </label>
                          <textarea
                            ref={messageInputRef}
                            id="connect-message"
                            name="message"
                            required
                            rows={3}
                            placeholder={t('connect.formMessagePlaceholderInline')}
                            value={messageVal}
                            onChange={(e) => setMessageVal(e.target.value)}
                            aria-invalid={!!messageError}
                            aria-describedby={messageError ? 'connect-message-error' : undefined}
                            className={`${inlineInputCls} resize-none`}
                          />
                        </div>
                        {messageError && (
                          <p
                            id="connect-message-error"
                            role="alert"
                            className="pl-6 text-xs text-red-400"
                          >
                            {messageError}
                          </p>
                        )}
                      </div>

                      {formStatus === 'error' && (
                        <p role="alert" className="pl-6 text-xs text-red-400">
                          <strong>{t('contact.form.errorTitle')}</strong>{' '}
                          {t('contact.form.errorBody')}
                        </p>
                      )}

                      <div className="flex items-center gap-4 pt-1">
                        <button
                          type="submit"
                          disabled={formStatus === 'pending'}
                          aria-busy={formStatus === 'pending'}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-plasma-lime)] px-5 py-2 font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-plasma-lime)] transition-colors hover:bg-[var(--color-plasma-lime)] hover:text-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {formStatus === 'pending' && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 16 16"
                              fill="none"
                              aria-hidden="true"
                              className="animate-spin"
                            >
                              <circle
                                cx="8"
                                cy="8"
                                r="6"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeOpacity="0.25"
                              />
                              <path
                                d="M14 8a6 6 0 0 0-6-6"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                          <span>
                            {formStatus === 'pending'
                              ? t('contact.form.sending')
                              : t('connect.formSendInline')}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={cancelForm}
                          disabled={formStatus === 'pending'}
                          className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)] disabled:opacity-30"
                        >
                          {t('connect.formCancelInline')}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Success state inside log */}
                {formStatus === 'success' && (
                  <div
                    className="mt-4 border-l-2 border-[var(--color-plasma-lime)] pl-4"
                    role="status"
                    aria-live="polite"
                  >
                    <p
                      ref={successRef}
                      tabIndex={-1}
                      className="font-display text-2xl outline-none"
                    >
                      {t('contact.form.successTitle', { name: nameVal || 'friend' })}
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      {t('contact.form.successBody')}
                    </p>
                    {isDemoForm && (
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-muted-2)]">
                        {t('contact.form.demoNote')}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={resetForm}
                      className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)] transition-colors hover:text-[var(--color-plasma-lime)]"
                    >
                      {t('contact.form.sendAnother')}
                    </button>
                  </div>
                )}
              </div>

              {/* Prompt input */}
              <div className="border-t border-[var(--color-border)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="select-none font-mono text-[var(--color-plasma-lime)]"
                  >
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
                    disabled={chatStatus === 'streaming'}
                    className="flex-1 rounded-sm bg-transparent font-mono text-sm text-[var(--color-fg)] outline-none placeholder-[var(--color-muted)] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-plasma-lime)] disabled:opacity-50"
                  />
                  {chatStatus === 'streaming' ? (
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

            {/* Suggestions + Leave-a-trace pill */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {messages.length === 0 &&
                suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => void send(s)}
                    disabled={chatStatus === 'streaming'}
                    className="rounded-full border border-[var(--color-border)] px-4 py-2 font-mono text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)] disabled:opacity-30"
                  >
                    {s}
                  </button>
                ))}
              <button
                type="button"
                onClick={handleLeaveTrace}
                disabled={formIsOpen || formStatus === 'success'}
                className="rounded-full border border-[var(--color-plasma-lime)] px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-plasma-lime)] transition-colors hover:bg-[var(--color-plasma-lime)] hover:text-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                {t('connect.leaveTracePill')}
              </button>
            </div>

            {/* Disclaimer */}
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-muted-2)]">
              {liveMode ? t('aiDemo.liveDisclaimer') : t('aiDemo.disclaimer')}
              {isDemoForm && <> · {t('contact.form.demoNote')}</>}
            </p>
          </div>

          {/* Direct-contact rail */}
          <aside className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <div className="tag">{t('connect.directHeading')}</div>
              <a
                ref={mailRef}
                href={`mailto:${t('contact.email')}`}
                className="group relative inline-flex items-center gap-3 rounded-full border border-[var(--color-border-strong)] px-6 py-4 text-base transition-colors duration-300 hover:border-[var(--color-plasma-lime)] hover:text-[var(--color-plasma-lime)] md:text-lg"
              >
                <span className="font-mono">{t('contact.email')}</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-plasma-lime)] text-[var(--color-bg)] transition-transform duration-500 group-hover:rotate-45">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M1 13L13 1M13 1H3M13 1v10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </a>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
                {t('connect.skipChat')}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="tag mb-2">{t('contact.socials')}</div>
              <a
                className="hover:text-[var(--color-plasma-lime)]"
                href={SOCIALS.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t('contact.github')} (${t('contact.opensInNewTab')})`}
              >
                {t('contact.github')} <span aria-hidden="true">↗</span>
              </a>
              <a
                className="hover:text-[var(--color-plasma-lime)]"
                href={SOCIALS.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t('contact.twitter')} (${t('contact.opensInNewTab')})`}
              >
                {t('contact.twitter')} <span aria-hidden="true">↗</span>
              </a>
              <a
                className="hover:text-[var(--color-plasma-lime)]"
                href={SOCIALS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t('contact.linkedin')} (${t('contact.opensInNewTab')})`}
              >
                {t('contact.linkedin')} <span aria-hidden="true">↗</span>
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
