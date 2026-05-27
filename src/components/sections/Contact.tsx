import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AlertCircle, ArrowUpRight, Check, ChevronDown, Mail } from 'lucide-react';
import { chromaticPulse, prefersReducedMotion, splitText } from '../../lib/animations';

gsap.registerPlugin(ScrollTrigger);

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SelectOption = { value: string; label: string };

export default function Contact() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleAccentRef = useRef<HTMLSpanElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
    timeline?: string;
    budget?: string;
  }>({});

  const endpoint = import.meta.env.VITE_FORM_ENDPOINT as string | undefined;
  const contactEmail = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ?? 'hello@zian-ai.dev';
  const demoMode = !endpoint;

  const timelineOptions = t('contact.form.timelineOptions', {
    returnObjects: true,
  }) as SelectOption[];
  const budgetOptions = t('contact.form.budgetOptions', {
    returnObjects: true,
  }) as SelectOption[];

  useEffect(() => {
    if (!titleRef.current) return;
    const ctx = gsap.context(() => {
      const charsA = splitText(titleRef.current!);
      const charsB = titleAccentRef.current ? splitText(titleAccentRef.current) : [];
      if (prefersReducedMotion()) {
        gsap.set([...charsA, ...charsB], { y: 0, opacity: 1 });
        return;
      }
      const tl = gsap.timeline({
        scrollTrigger: { trigger: titleRef.current!, start: 'top 88%', once: true },
      });
      tl.fromTo(
        charsA,
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.018 },
      );
      if (charsB.length) {
        tl.fromTo(
          charsB,
          { yPercent: 110, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.018 },
          '-=0.65',
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, [i18n.language]);

  useEffect(() => {
    if (status !== 'success' || !formRef.current) return;
    chromaticPulse(formRef.current);
  }, [status]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim();
    const message = String(fd.get('message') ?? '').trim();
    const timeline = String(fd.get('timeline') ?? '').trim();
    const budget = String(fd.get('budget') ?? '').trim();

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
        body: JSON.stringify({ name, email, message, timeline, budget }),
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
      className="relative mx-auto max-w-7xl px-6 py-32 lg:px-10 lg:pl-[280px] lg:py-40"
    >
      <div className="mb-16 max-w-4xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
          {t('contact.eyebrow')}
        </span>
        <h2
          ref={titleRef}
          className="mt-5 font-display text-[clamp(2.5rem,8vw,7rem)] leading-[0.95] tracking-[-0.04em] text-white"
        >
          {t('contact.title')}
        </h2>
        <h2
          aria-hidden="true"
          className="font-display text-[clamp(2.5rem,8vw,7rem)] leading-[0.95] tracking-[-0.04em]"
        >
          <span ref={titleAccentRef} className="text-gradient">
            {t('contact.titleAccent')}
          </span>
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-[var(--color-muted)]">
          {t('contact.lede')}
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <form
          ref={formRef}
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

          <div className="grid gap-5 md:grid-cols-2">
            <SelectField
              id="timeline"
              label={t('contact.form.timeline')}
              placeholder={t('contact.form.timelinePlaceholder')}
              options={timelineOptions}
              error={errors.timeline}
            />
            <SelectField
              id="budget"
              label={t('contact.form.budget')}
              placeholder={t('contact.form.budgetPlaceholder')}
              options={budgetOptions}
              error={errors.budget}
            />
          </div>

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
            <ArrowUpRight
              size={16}
              strokeWidth={2}
              className="transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
            />
          </button>

          {status === 'success' && (
            <p
              role="status"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-accent-cyan)]"
            >
              <Check size={14} strokeWidth={2.4} aria-hidden="true" />
              {t('contact.form.success')}
            </p>
          )}
          {status === 'error' && (
            <p
              role="alert"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-red-400"
            >
              <AlertCircle size={14} strokeWidth={2.2} aria-hidden="true" />
              {t('contact.form.error')}
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
  const invalidRing = error
    ? 'border-[var(--color-accent-violet)]/60 shadow-[0_0_0_3px_rgba(168,85,247,0.18)]'
    : '';
  const baseClass = `peer w-full rounded-lg border border-white/10 bg-[var(--color-bg)]/60 px-4 pt-6 pb-2 text-white outline-none transition-all placeholder-transparent focus:border-[var(--color-accent-cyan)] focus:shadow-[0_0_0_3px_rgba(0,229,255,0.18)] ${invalidRing}`;

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
          className="mt-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent-violet)]"
        >
          {error}
        </span>
      )}
    </div>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  options: SelectOption[];
  error?: string;
};

function SelectField({ id, label, placeholder, options, error }: SelectFieldProps) {
  // <select> has no :placeholder-shown — track value to drive the floating label.
  const [value, setValue] = useState('');
  const filled = value !== '';
  const invalidRing = error
    ? 'border-[var(--color-accent-violet)]/60 shadow-[0_0_0_3px_rgba(168,85,247,0.18)]'
    : '';

  return (
    <div className="relative">
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`peer w-full appearance-none rounded-lg border border-white/10 bg-[var(--color-bg)]/60 px-4 pt-6 pb-2 pr-10 text-white outline-none transition-all focus:border-[var(--color-accent-cyan)] focus:shadow-[0_0_0_3px_rgba(0,229,255,0.18)] ${invalidRing} ${
          filled ? 'text-white' : 'text-transparent'
        }`}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[var(--color-bg-elev)] text-white">
            {opt.label}
          </option>
        ))}
      </select>
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-4 transition-all ${
          filled
            ? 'top-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted-2)] peer-focus:text-[var(--color-accent-cyan)]'
            : 'top-4 text-sm text-[var(--color-muted)]'
        }`}
      >
        {label}
      </label>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] transition-transform peer-focus:text-[var(--color-accent-cyan)]"
        aria-hidden="true"
      />
      {error && (
        <span
          id={`${id}-error`}
          className="mt-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent-violet)]"
        >
          {error}
        </span>
      )}
    </div>
  );
}
