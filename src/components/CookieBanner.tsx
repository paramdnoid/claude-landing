import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { getConsent, setConsent } from "../lib/consent";
import { useLocale } from "../lib/useLocale";

const ANALYTICS_AVAILABLE = !!import.meta.env.VITE_ANALYTICS_SCRIPT_URL;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function CookieBanner() {
  const { t } = useTranslation();
  const locale = useLocale();
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const rejectRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!ANALYTICS_AVAILABLE) return;
    if (getConsent() != null) return;
    const id = window.setTimeout(() => setVisible(true), 600);
    return () => window.clearTimeout(id);
  }, []);

  // Focus management: park focus inside the dialog on appear, restore on close.
  useEffect(() => {
    if (!visible) return;
    previouslyFocused.current =
      (document.activeElement as HTMLElement | null) ?? null;
    // Default to the least destructive action (Reject) so an accidental Enter
    // doesn't opt the user into analytics.
    requestAnimationFrame(() => rejectRef.current?.focus());
    return () => {
      previouslyFocused.current?.focus();
    };
  }, [visible]);

  const dismiss = (choice: "accepted" | "rejected") => {
    setConsent(choice);
    setVisible(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      dismiss("rejected");
      return;
    }
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusables = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );
    if (focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!ANALYTICS_AVAILABLE || !visible) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("consent.title")}
      onKeyDown={onKeyDown}
      className="fixed inset-x-4 bottom-4 z-[80] mx-auto max-w-2xl rounded-2xl border border-white/10 bg-[var(--color-bg-elev)]/95 p-5 shadow-2xl backdrop-blur md:inset-x-auto md:bottom-6 md:right-6 md:left-auto md:w-[420px]"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[var(--color-plasma-cyan)]">
          <Cookie size={16} strokeWidth={1.75} />
        </span>
        <div className="flex-1">
          <h2 className="font-display text-base text-white">{t("consent.title")}</h2>
          <p className="mt-1 text-sm text-muted">
            {t("consent.body")}{" "}
            <Link
              to={`/${locale}/datenschutz`}
              className="underline decoration-white/20 underline-offset-4 hover:text-white"
            >
              {t("consent.learnMore")}
            </Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => dismiss("accepted")}
              className="rounded-full bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-bg transition-transform hover:-translate-y-0.5"
            >
              {t("consent.accept")}
            </button>
            <button
              ref={rejectRef}
              type="button"
              onClick={() => dismiss("rejected")}
              className="rounded-full border border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted transition-colors hover:text-white"
            >
              {t("consent.reject")}
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label={t("consent.close")}
          onClick={() => dismiss("rejected")}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-2 transition-colors hover:text-white"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
