import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { sendChat, isLiveBackend, OLLAMA_MODEL, type ChatMessage } from '../../lib/chatBackend';
import { prefersReducedMotion, revealWordsOnScroll } from "../../lib/animations";
import { resolveLang } from "../../lib/lang";
import { useMagnet } from '../../lib/useMagnet';
import { SOCIAL_LINKS } from '../../lib/socials';

type ChatStatus = 'idle' | 'streaming' | 'error' | 'stopped';
type FormStatus = 'closed' | 'open' | 'pending' | 'success' | 'error';

const FORM_ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT;
const liveMode = isLiveBackend();
const isDemoForm = !FORM_ENDPOINT;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTENT_RE = /(contact|email|reach|hire|work\s+together|projekt|kontakt|erreich|schreib|anfrage|zusammenarbeit)/i;

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
  const submitErrorRef = useRef<HTMLParagraphElement>(null);
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

  // Focus success heading on success, or error alert on submit failure
  useEffect(() => {
    if (formStatus === 'success') successRef.current?.focus();
    else if (formStatus === 'error') submitErrorRef.current?.focus();
  }, [formStatus]);

  const openForm = useCallback(() => {
    setFormStatus((prev) => (prev === 'closed' || prev === 'error' ? 'open' : prev));
  }, []);

  const getMockReply = useCallback(
    (userMsg: string): string => {
      const suggestions = t('aiDemo.suggestions', { returnObjects: true });
      const replies = t('aiDemo.mock.replies', { returnObjects: true });
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

  type ValidationResult =
    | { valid: true }
    | { valid: false; focus: 'email' | 'message' };

  const validateForm = (): ValidationResult => {
    const emailOk = emailVal.trim().length > 0 && EMAIL_RE.test(emailVal);
    const messageOk = messageVal.trim().length > 0;
    setEmailError(emailOk ? '' : t('contact.form.invalidEmail'));
    setMessageError(messageOk ? '' : t('contact.form.required'));
    if (!emailOk) return { valid: false, focus: 'email' };
    if (!messageOk) return { valid: false, focus: 'message' };
    return { valid: true };
  };

  const resetForm = useCallback(
    (opts: { clearFields: boolean } = { clearFields: false }) => {
      setFormStatus('closed');
      setEmailError('');
      setMessageError('');
      if (opts.clearFields) {
        setNameVal('');
        setEmailVal('');
        setMessageVal('');
      }
    },
    [],
  );

  const cancelForm = useCallback(() => resetForm({ clearFields: false }), [resetForm]);
  const sendAnotherMessage = useCallback(() => resetForm({ clearFields: true }), [resetForm]);

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = validateForm();
    if (!result.valid) {
      if (result.focus === 'email') emailInputRef.current?.focus();
      else messageInputRef.current?.focus();
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
      const res = await fetch(FORM_ENDPOINT, {
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

  const suggestions = t('aiDemo.suggestions', { returnObjects: true });
  const formIsOpen = formStatus === 'open' || formStatus === 'pending' || formStatus === 'error';

  // Inline terminal-style input class
  const inlineInputCls =
    'flex-1 rounded-sm bg-transparent py-1.5 font-mono text-sm text-fg outline-none placeholder-[var(--color-muted)] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-plasma-lime)]';

  return (
    <section id="contact" className="relative px-6 pb-12 pt-16 md:px-10 md:pb-16 md:pt-24">
      {/* Backwards-compat anchor for legacy #ai-demo links */}
      <span id="ai-demo" aria-hidden="true" className="block -translate-y-24" />

      <div className="mx-auto max-w-400">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="tag mb-6">{t('connect.eyebrow')}</div>
            <h2 ref={headlineRef} className="font-display text-display-lg">
              {t('contact.title')}
            </h2>
            <p className="lead mt-4 max-w-xl">{t('connect.intro')}</p>
          </div>
          {/* Mode badge */}
          <div className="flex items-center gap-3">
            {liveMode ? (
              <>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-plasma-lime glow-lime" />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  {t('aiDemo.poweredBy')} · {OLLAMA_MODEL}
                </span>
              </>
            ) : (
              <>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]" />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  {t('aiDemo.demoMode')}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-12">
          {/* Terminal column — spans 2 */}
          <div className="lg:col-span-2">
            <div className="glass overflow-hidden rounded-2xl border border-border-strong">
              {/* Chrome */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div aria-hidden="true" className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500/60" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <span className="h-3 w-3 rounded-full bg-green-500/60" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  {t(`aiDemo.status.${chatStatus}`)}
                </span>
                <button
                  type="button"
                  onClick={reset}
                  className="relative font-mono text-[10px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-fg after:absolute after:inset-x-0 after:-inset-y-3 after:content-['']"
                >
                  {t('aiDemo.controls.reset')}
                </button>
              </div>

              {/* Scroll container: holds chat log + form + success — form sits outside the
                  aria-live region so keystrokes don't re-announce on every state tick. */}
              {/* Compact by default; grows when the inline form opens so the
                  whole form stays visible without an empty terminal otherwise. */}
              <div
                ref={logRef}
                className={`overflow-y-auto p-5 font-mono text-sm transition-[height] duration-300 ${
                  formIsOpen ? 'h-80' : 'h-64'
                }`}
              >
                <div
                  role="log"
                  aria-live="polite"
                  aria-busy={chatStatus === 'streaming'}
                  aria-label={t('aiDemo.logLabel')}
                >
                  {messages.length === 0 && !streamBuffer && formStatus === 'closed' && (
                    <p className="text-muted">
                      <span aria-hidden="true" className="text-plasma-lime">→</span>{' '}
                      {t('aiDemo.status.idle')}
                    </p>
                  )}
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`mb-3 ${msg.role === 'user' ? 'text-fg' : 'text-fg/80'}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mr-2 select-none ${msg.role === 'user' ? 'text-plasma-lime' : 'text-muted'}`}
                      >
                        {msg.role === 'user' ? '>' : '//'}
                      </span>
                      {msg.content}
                    </div>
                  ))}
                  {streamBuffer && (
                    <div aria-hidden="true" className="mb-3 text-fg/80">
                      <span className="mr-2 select-none text-muted">//</span>
                      {streamBuffer}
                      {!reduceMotion && (
                        <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-plasma-lime" />
                      )}
                    </div>
                  )}
                </div>

                {/* Inline form — outside role="log" so keystrokes don't re-trigger announcements. */}
                {formIsOpen && (
                  <div className="mt-4 border-l-2 border-[var(--color-plasma-lime)] pl-4">
                    <h3 id="connect-form-heading" className="sr-only">{t('aiDemo.formHeading')}</h3>
                    <form
                      onSubmit={(e) => { void handleFormSubmit(e); }}
                      noValidate
                      aria-labelledby="connect-form-heading"
                      className="flex flex-col gap-4"
                    >
                      {/* Honeypot */}
                      <input
                        type="text"
                        name="_gotcha"
                        tabIndex={-1}
                        aria-hidden="true"
                        className="hidden"
                      />

                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="connect-name"
                          className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted"
                        >
                          <span aria-hidden="true" className="text-plasma-lime">{'>'}</span>
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
                          className={`pl-6 ${inlineInputCls}`}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="connect-email"
                          className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted"
                        >
                          <span aria-hidden="true" className="text-plasma-lime">{'>'}</span>
                          <span>
                            {t('contact.form.email')}{' '}
                            <span aria-hidden="true" className="text-error">*</span>
                          </span>
                        </label>
                        <input
                          ref={emailInputRef}
                          id="connect-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          required
                          placeholder={t('connect.formEmailPlaceholderInline')}
                          value={emailVal}
                          onChange={(e) => setEmailVal(e.target.value)}
                          aria-invalid={!!emailError}
                          aria-describedby={emailError ? 'connect-email-error' : undefined}
                          className={`pl-6 ${inlineInputCls}`}
                        />
                        {emailError && (
                          <p
                            id="connect-email-error"
                            role="alert"
                            className="pl-6 text-xs text-error"
                          >
                            {emailError}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="connect-message"
                          className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted"
                        >
                          <span aria-hidden="true" className="text-plasma-lime">{'>'}</span>
                          <span>
                            {t('contact.form.message')}{' '}
                            <span aria-hidden="true" className="text-error">*</span>
                          </span>
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
                          className={`pl-6 ${inlineInputCls} resize-none`}
                        />
                        {messageError && (
                          <p
                            id="connect-message-error"
                            role="alert"
                            className="pl-6 text-xs text-error"
                          >
                            {messageError}
                          </p>
                        )}
                      </div>

                      {formStatus === 'error' && (
                        <p
                          ref={submitErrorRef}
                          tabIndex={-1}
                          role="alert"
                          className="pl-6 text-xs text-error outline-none"
                        >
                          <strong>{t('contact.form.errorTitle')}</strong>{' '}
                          {t('contact.form.errorBody')}
                        </p>
                      )}

                      <div className="flex items-center gap-4 pt-1">
                        <button
                          type="submit"
                          disabled={formStatus === 'pending'}
                          aria-busy={formStatus === 'pending'}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-plasma-lime)] px-5 py-2 font-mono text-xs uppercase tracking-[0.15em] text-plasma-lime transition-colors hover:bg-plasma-lime hover:text-bg disabled:cursor-not-allowed disabled:opacity-50"
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
                          className="relative font-mono text-[10px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-fg disabled:cursor-not-allowed disabled:opacity-30 after:absolute after:inset-x-0 after:-inset-y-3 after:content-['']"
                        >
                          {t('connect.formCancelInline')}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Success state — separate role="status" live region. */}
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
                    <p className="mt-2 text-sm text-muted">
                      {t('contact.form.successBody')}
                    </p>
                    {isDemoForm && (
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                        {t('contact.form.demoNote')}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={sendAnotherMessage}
                      className="relative mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-plasma-lime after:absolute after:inset-x-0 after:-inset-y-3 after:content-['']"
                    >
                      {t('contact.form.sendAnother')}
                    </button>
                  </div>
                )}
              </div>

              {/* Prompt input */}
              <div className="border-t border-border px-5 py-4">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="select-none font-mono text-plasma-lime"
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
                    className="flex-1 rounded-sm bg-transparent font-mono text-sm text-fg outline-none placeholder-[var(--color-muted)] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-plasma-lime)] disabled:opacity-50"
                  />
                  {chatStatus === 'streaming' ? (
                    <button
                      type="button"
                      onClick={stop}
                      className="relative font-mono text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-error after:absolute after:inset-x-0 after:-inset-y-3 after:content-['']"
                    >
                      {t('aiDemo.controls.stop')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void send(input)}
                      disabled={!input.trim()}
                      className="relative font-mono text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-fg disabled:cursor-not-allowed disabled:opacity-30 after:absolute after:inset-x-0 after:-inset-y-3 after:content-['']"
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
                    className="rounded-full border border-border px-4 py-2 font-mono text-xs text-muted transition-colors hover:border-border-strong hover:text-fg disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {s}
                  </button>
                ))}
              <button
                type="button"
                onClick={handleLeaveTrace}
                disabled={formIsOpen || formStatus === 'success'}
                className="rounded-full border border-[var(--color-plasma-lime)] px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] text-plasma-lime transition-colors hover:bg-plasma-lime hover:text-bg disabled:cursor-not-allowed disabled:opacity-30"
              >
                {t('connect.leaveTracePill')}
              </button>
            </div>

            {/* Disclaimer */}
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
              {liveMode ? t('aiDemo.liveDisclaimer') : t('aiDemo.disclaimer')}
              {isDemoForm && <> · {t('contact.form.demoNote')}</>}
            </p>
          </div>

          {/* Direct-contact rail — vertically centered against the tall terminal
              so the short rail (socials are env-gated and often absent) doesn't
              leave a large void in the lower-right on desktop. */}
          <aside className="flex flex-col gap-10 lg:justify-center">
            <div className="flex flex-col gap-4">
              <div className="tag">{t('connect.directHeading')}</div>
              <a
                ref={mailRef}
                href={`mailto:${t('contact.email')}`}
                className="group relative inline-flex items-center gap-3 rounded-full border border-border-strong px-6 py-4 text-base transition-colors duration-300 hover:border-[var(--color-plasma-lime)] hover:text-plasma-lime md:text-lg"
              >
                <span className="font-mono">{t('contact.email')}</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-plasma-lime text-bg transition-transform duration-500 group-hover:rotate-45">
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
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                {t('connect.skipChat')}
              </p>
            </div>

            {SOCIAL_LINKS.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="tag mb-2">{t('contact.socials')}</div>
                {SOCIAL_LINKS.map(({ key, url }) => (
                  <a
                    key={key}
                    className="hover:text-plasma-lime"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${t(`contact.${key}`)} (${t('contact.opensInNewTab')})`}
                  >
                    {t(`contact.${key}`)} <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
