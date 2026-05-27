import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useMagnet } from '../../lib/useMagnet';
import { revealWordsOnScroll } from '../../lib/animations';

type FormState = 'idle' | 'pending' | 'success' | 'error';

const FORM_ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT;
const isDemoMode = !FORM_ENDPOINT;

// TODO: Replace these with real social profile URLs before launch
const SOCIALS = {
  github: 'https://github.com/andrezimmermann',
  twitter: 'https://x.com/andrezimmermann',
  linkedin: 'https://www.linkedin.com/in/andrezimmermann',
} as const;

export default function Contact() {
  const { t } = useTranslation();
  const mailRef = useMagnet<HTMLAnchorElement>(0.25);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  const [state, setState] = useState<FormState>('idle');
  const [nameVal, setNameVal] = useState('');
  const [emailVal, setEmailVal] = useState('');
  const [messageVal, setMessageVal] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [messageError, setMessageError] = useState('');

  useEffect(() => {
    if (headlineRef.current) {
      revealWordsOnScroll(headlineRef.current, { start: 'top 80%', end: 'bottom 50%', scrub: 0.6 });
    }
  }, []);

  const validate = (): boolean => {
    let valid = true;
    if (!nameVal.trim()) {
      setNameError(t('contact.form.required'));
      valid = false;
    } else {
      setNameError('');
    }
    if (!emailVal.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    const form = e.currentTarget;
    setState('pending');

    if (isDemoMode) {
      await new Promise((r) => setTimeout(r, 700));
      // eslint-disable-next-line no-console
      console.info('[demo] Contact form submitted:', { name: nameVal, email: emailVal, message: messageVal });
      setState('success');
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
      setState('success');
    } catch {
      setState('error');
    }
  };

  const reset = () => {
    setState('idle');
    setNameVal('');
    setEmailVal('');
    setMessageVal('');
    setNameError('');
    setEmailError('');
    setMessageError('');
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-white/5 px-4 py-3 font-mono text-sm text-[var(--color-fg)] placeholder-[var(--color-muted)] outline-none transition-colors focus:border-[var(--color-plasma-lime)] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-plasma-lime)] ${
      hasError ? 'border-red-500' : 'border-[var(--color-border-strong)]'
    }`;

  return (
    <section id="contact" className="relative px-6 pb-16 pt-40 md:px-10 md:pb-24 md:pt-56">
      <div className="mx-auto max-w-[1600px]">
        <div className="tag mb-6">{t('contact.eyebrow')}</div>
        <h2 ref={headlineRef} className="font-display text-display-xl">
          {t('contact.title')}
        </h2>

        <div className="mt-20 grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Form column */}
          <div>
            {state === 'success' ? (
              <div className="flex flex-col gap-6">
                <p className="font-display text-3xl">{t('contact.form.successTitle', { name: nameVal })}</p>
                <p className="text-[var(--color-muted)]">{t('contact.form.successBody')}</p>
                {isDemoMode && (
                  <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-muted-2)]">
                    {t('contact.form.demoNote')}
                  </p>
                )}
                <button
                  type="button"
                  onClick={reset}
                  className="w-fit rounded-full border border-[var(--color-border-strong)] px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] transition-colors hover:border-[var(--color-plasma-lime)] hover:text-[var(--color-plasma-lime)]"
                >
                  {t('contact.form.sendAnother')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                {/* Honeypot */}
                <input type="text" name="_gotcha" tabIndex={-1} aria-hidden="true" className="hidden" />

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact-name"
                    className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-muted)]"
                  >
                    {t('contact.form.name')}
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder={t('contact.form.namePlaceholder')}
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    aria-invalid={!!nameError}
                    aria-describedby={nameError ? 'contact-name-error' : undefined}
                    className={inputClass(!!nameError)}
                  />
                  {nameError && (
                    <p id="contact-name-error" role="alert" className="text-xs text-red-400">
                      {nameError}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact-email"
                    className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-muted)]"
                  >
                    {t('contact.form.email')}
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t('contact.form.emailPlaceholder')}
                    value={emailVal}
                    onChange={(e) => setEmailVal(e.target.value)}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'contact-email-error' : undefined}
                    className={inputClass(!!emailError)}
                  />
                  {emailError && (
                    <p id="contact-email-error" role="alert" className="text-xs text-red-400">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="contact-message"
                    className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--color-muted)]"
                  >
                    {t('contact.form.message')}
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    placeholder={t('contact.form.messagePlaceholder')}
                    value={messageVal}
                    onChange={(e) => setMessageVal(e.target.value)}
                    aria-invalid={!!messageError}
                    aria-describedby={messageError ? 'contact-message-error' : undefined}
                    className={`${inputClass(!!messageError)} resize-none`}
                  />
                  {messageError && (
                    <p id="contact-message-error" role="alert" className="text-xs text-red-400">
                      {messageError}
                    </p>
                  )}
                </div>

                {state === 'error' && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                  >
                    <strong>{t('contact.form.errorTitle')}</strong> {t('contact.form.errorBody')}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={state === 'pending'}
                  className="group relative inline-flex w-fit items-center gap-3 rounded-full border border-[var(--color-plasma-lime)] px-8 py-4 font-mono text-sm uppercase tracking-[0.15em] text-[var(--color-plasma-lime)] transition-all hover:bg-[var(--color-plasma-lime)] hover:text-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {state === 'pending' ? t('contact.form.sending') : t('contact.form.send')}
                </button>
              </form>
            )}
          </div>

          {/* Right column: mailto + socials */}
          <div className="flex flex-col items-start justify-between gap-12 lg:items-end">
            <a
              ref={mailRef}
              href={`mailto:${t('contact.email')}`}
              className="group relative inline-flex items-center gap-4 rounded-full border border-[var(--color-border-strong)] px-8 py-5 text-lg transition-colors duration-300 hover:border-[var(--color-plasma-lime)] hover:text-[var(--color-plasma-lime)] md:px-10 md:py-6 md:text-2xl"
            >
              <span className="font-mono">{t('contact.email')}</span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-plasma-lime)] text-[var(--color-bg)] transition-transform duration-500 group-hover:rotate-45 md:h-12 md:w-12">
                <svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M1 13L13 1M13 1H3M13 1v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
            </a>

            <div className="flex flex-col gap-2 lg:items-end">
              <div className="tag mb-2">{t('contact.socials')}</div>
              <a
                className="hover:text-[var(--color-plasma-lime)]"
                href={SOCIALS.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('contact.github')} ↗
              </a>
              <a
                className="hover:text-[var(--color-plasma-lime)]"
                href={SOCIALS.twitter}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('contact.twitter')} ↗
              </a>
              <a
                className="hover:text-[var(--color-plasma-lime)]"
                href={SOCIALS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('contact.linkedin')} ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
