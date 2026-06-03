import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useParams } from "react-router-dom";
import { isLang, resolveLang, type Lang } from "../lib/lang";

const SITE_URL_RAW = (import.meta.env.VITE_SITE_URL ?? "https://zian-ai.dev");
const SITE_URL = SITE_URL_RAW.replace(/\/$/, "");
const PERSON_NAME = "André Zimmermann";

// Map each locale-stripped subpath to its i18n title key. `as const` keeps the
// values as literal key strings so they satisfy i18next's strictKeyChecks.
const TITLE_KEYS = {
  "/": "meta.home.title",
  "/impressum": "meta.imprint.title",
  "/datenschutz": "meta.privacy.title",
} as const;

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (hreflang) el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(id: string, data: object) {
  let el = document.head.querySelector<HTMLScriptElement>(`script[data-jsonld="${id}"]`);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-jsonld", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export default function Seo() {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();
  const { lang: paramLang } = useParams<{ lang: string }>();

  const lang: Lang = isLang(paramLang) ? paramLang : resolveLang(i18n.language);

  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const rest = isLang(segments[0]) ? segments.slice(1) : segments;
    const subpath = rest.length === 0 ? "/" : `/${rest.join("/")}`;

    // Translate for the URL's locale explicitly — `lang` may differ from the
    // active i18n language during navigation, so a fixed-language t() is required.
    const tl = i18n.getFixedT(lang);
    const titleKey = TITLE_KEYS[subpath as keyof typeof TITLE_KEYS] ?? "meta.home.title";
    const title = tl(titleKey);
    const desc = tl("meta.description");
    const canonical = subpath === "/" ? `${SITE_URL}/${lang}` : `${SITE_URL}/${lang}${subpath}`;
    const altDe = subpath === "/" ? `${SITE_URL}/de` : `${SITE_URL}/de${subpath}`;
    const altEn = subpath === "/" ? `${SITE_URL}/en` : `${SITE_URL}/en${subpath}`;

    document.title = title;
    document.documentElement.lang = lang;

    setMeta("description", desc);
    setMeta("og:title", title, "property");
    setMeta("og:description", desc, "property");
    setMeta("og:url", canonical, "property");
    setMeta("og:locale", lang === "de" ? "de_DE" : "en_US", "property");
    setMeta("og:image", `${SITE_URL}/og-image.png`, "property");
    setMeta("og:image:type", "image/png", "property");
    setMeta("og:image:width", "1200", "property");
    setMeta("og:image:height", "630", "property");
    setMeta("og:type", "website", "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", desc);
    setMeta("twitter:image", `${SITE_URL}/og-image.png`);

    setLink("canonical", canonical);
    setLink("alternate", altDe, "de");
    setLink("alternate", altEn, "en");
    setLink("alternate", altDe, "x-default");

    setJsonLd("person", {
      "@context": "https://schema.org",
      "@type": "Person",
      name: PERSON_NAME,
      url: SITE_URL,
      jobTitle: tl("meta.jobTitle"),
      worksFor: { "@type": "Organization", name: "ZIAN AI CONCEPTS" },
    });

    setJsonLd("service", {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: "ZIAN AI CONCEPTS",
      url: SITE_URL,
      image: `${SITE_URL}/og-image.png`,
      description: desc,
      founder: { "@type": "Person", name: PERSON_NAME },
      areaServed: lang === "de" ? "DE" : "Worldwide",
      knowsAbout: ["Artificial Intelligence", "Web Development", "App Development", "AI Training", "Enterprise AI Integration"],
    });

    if (subpath === "/") {
      setJsonLd("website", {
        "@context": "https://schema.org",
        "@type": "WebSite",
        url: canonical,
        name: "ZIAN AI CONCEPTS",
        inLanguage: lang === "de" ? "de-DE" : "en-US",
      });
    }

    if (subpath === "/impressum" || subpath === "/datenschutz") {
      setJsonLd("breadcrumb", {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "ZIAN AI CONCEPTS",
            item: `${SITE_URL}/${lang}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: title,
            item: canonical,
          },
        ],
      });
    }
  }, [pathname, lang, i18n]);

  return null;
}
