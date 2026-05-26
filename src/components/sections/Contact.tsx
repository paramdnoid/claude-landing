import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mail, Send } from 'lucide-react';
import { prefersReducedMotion, splitText } from '../../lib/animations';

gsap.registerPlugin(ScrollTrigger);

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  const endpoint = import.meta.env.VITE_FORM_ENDPOINT;
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL ?? 'hello@zian-ai.dev';
  const demoMode = !endpoint;

  useEffect(() => {
    if (!titleRef.current) return;
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const chars = splitText(titleRef.current!);
      gsap.fromTo(
        chars,
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.02,
          scrollTrigger: {
            trigger: titleRef.current!,
            start: 'top 90%',
            once: true,
          },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, [i18n.language]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim();
    const message = String(fd.get('message') ?? '').trim();

    const nextErrors: typeof errors = {};
    if (!name) nextErrors.name = t('contact.form.required');
    if (!email) nextErrors.email = t('contact.form.required');
    else if (!EMAIL_RE.test(email)) nextErrors.email = t('contact.form.invalidEmail');
    if (!message) nextErrors.message = t('contact.form.required');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (demoMode) {
      setStatus('submitting');
      await new Promise((r) => setTimeout(r, prefersReducedMotion() ? 0 : 700));
      setStatus('success');
      (e.target as HTMLFormElement).reset();
      return;
    }

    try {
      setStatus('submitting');
      const res = await fetch(endpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error('Bad response');
      setStatus('success');
      (e.target as HTMLFormElement).reset();
    } catch {
      setStatus('error');
    }
  }

  return (
    <section
      ref={sectionRef}
      id="contact"
      aria-label="Contact"
      className="relative mx-auto max-w-7xl px-6 py-32 lg:px-10 lg:py-40"
    >
      <div className="mb-16 max-w-3xl">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
          {t('contact.eyebrow')}
        </span>
        <h2
          ref={titleRef}
          className="mt-4 font-display text-[clamp(2.5rem,8vw,7rem)] leading-[0.95] text-gradient"
        >
          {t('contact.title')}
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-[var(--color-muted)]">
          {t('contact.lede')}
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid gap-5 rounded-3xl border border-white/10 bg-[var(--color-bg-elev)]/60 p-7 backdrop-blur md:p-10"
        >
          {demoMode && (
            <p className="rounded-lg border border-[var(--color-accent-violet)]/30 bg-[var(--color-accent-violet)]/10 p-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white/80">
              {t('contact.form.demo')}
            </p>
          )}

          <Field
            id="name"
            label={t('contact.form.name')}
            error={errors.name}
            autoComplete="name"
            required
          />
          <Field
            id="email"
            type="email"
            label={t('contact.form.email')}
            error={errors.email}
            autoComplete="email"
            required
          />
          <Field
            id="message"
            label={t('contact.form.message')}
            error={errors.message}
            as="textarea"
            rows={5}
            required
          />

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="group relative mt-2 inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-7 py-3.5 font-mono text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-bg)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] opacity-0 transition-opacity group-hover:opacity-100"
            />
            <span className="transition-colors group-hover:text-white">
              {status === 'submitting' ? t('contact.form.submitting') : t('contact.form.submit')}
            </span>
            <Send size={14} className="transition-colors group-hover:text-white" />
          </button>

          {status === 'success' && (
            <p role="status" className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-accent-cyan)]">
              ✓ {t('contact.form.success')}
            </p>
          )}
          {status === 'error' && (
            <p role="alert" className="font-mono text-xs uppercase tracking-[0.18em] text-red-400">
              ! {t('contact.form.error')}
            </p>
          )}
        </form>

        <aside className="flex flex-col justify-end gap-6">
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-muted-2)]">
            {t('contact.or')}
          </span>
          <a
            href={`mailto:${contactEmail}`}
            className="group inline-flex items-center gap-3 font-display text-2xl text-white transition-colors hover:text-[var(--color-accent-cyan)] md:text-3xl"
          >
            <Mail size={24} className="transition-transform group-hover:-translate-y-0.5" />
            <span className="underline decoration-white/20 underline-offset-8 transition-colors group-hover:decoration-[var(--color-accent-cyan)]">
              {contactEmail}
            </span>
          </a>
        </aside>
      </div>
    </section>
  );
}

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  as?: 'input' | 'textarea';
  rows?: number;
};

function Field({
  id,
  label,
  error,
  type = 'text',
  required,
  autoComplete,
  as = 'input',
  rows,
}: FieldProps) {
  const baseClass =
    'peer w-full rounded-lg border border-white/10 bg-[var(--color-bg)]/60 px-4 pt-6 pb-2 text-white outline-none transition-all placeholder-transparent focus:border-[var(--color-accent-cyan)] focus:shadow-[0_0_0_3px_rgba(0,229,255,0.18)]';

  return (
    <div className="relative">
      {as === 'textarea' ? (
        <textarea
          id={id}
          name={id}
          rows={rows}
          required={required}
          autoComplete={autoComplete}
          placeholder={label}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${baseClass} resize-y`}
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          required={required}
          autoComplete={autoComplete}
          placeholder={label}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={baseClass}
        />
      )}
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted-2)] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-[var(--color-muted)] peer-focus:top-2 peer-focus:text-[10px] peer-focus:tracking-[0.2em] peer-focus:text-[var(--color-accent-cyan)]"
      >
        {label}
      </label>
      {error && (
        <span
          id={`${id}-error`}
          className="mt-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-red-400"
        >
          {error}
        </span>
      )}
    </div>
  );
}
