import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { getConsent, setConsent } from "../lib/consent";

const ANALYTICS_AVAILABLE = !!import.meta.env.VITE_ANALYTICS_SCRIPT_URL;

export default function CookieBanner() {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const locale = lang ?? "de";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ANALYTICS_AVAILABLE) return;
    if (getConsent() != null) return;
    const id = window.setTimeout(() => setVisible(true), 600);
    return () => window.clearTimeout(id);
  }, []);

  if (!ANALYTICS_AVAILABLE || !visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t("consent.title")}
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
              onClick={() => {
                setConsent("accepted");
                setVisible(false);
              }}
              className="rounded-full bg-white px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-bg)] transition-transform hover:-translate-y-0.5"
            >
              {t("consent.accept")}
            </button>
            <button
              type="button"
              onClick={() => {
                setConsent("rejected");
                setVisible(false);
              }}
              className="rounded-full border border-white/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted transition-colors hover:text-white"
            >
              {t("consent.reject")}
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label={t("consent.close")}
          onClick={() => {
            setConsent("rejected");
            setVisible(false);
          }}
          className="text-muted-2 transition-colors hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
