import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://zian-ai.dev').replace(/\/$/, '');
const PERSON_NAME = 'André Zimmermann';

const TITLES: Record<string, Record<string, string>> = {
  '/': {
    de: 'ZIAN AI CONCEPTS — KI-Engineering, Kurse, Integration',
    en: 'ZIAN AI CONCEPTS — AI Engineering, Courses, Integration',
  },
  '/impressum': {
    de: 'Impressum — ZIAN AI CONCEPTS',
    en: 'Imprint — ZIAN AI CONCEPTS',
  },
  '/datenschutz': {
    de: 'Datenschutz — ZIAN AI CONCEPTS',
    en: 'Privacy — ZIAN AI CONCEPTS',
  },
};

const DESC: Record<string, string> = {
  de: 'André Zimmermann baut KI-gestützte Web- & App-Produkte, hält KI-Kurse und integriert KI in Unternehmen.',
  en: 'André Zimmermann builds AI-driven web & app products, runs AI courses and integrates AI into companies.',
};

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(id: string, data: object) {
  let el = document.head.querySelector<HTMLScriptElement>(`script[data-jsonld="${id}"]`);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-jsonld', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export default function Seo() {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();
  const lang = i18n.language.startsWith('en') ? 'en' : 'de';

  useEffect(() => {
    const title = TITLES[pathname]?.[lang] ?? TITLES['/'][lang];
    const desc = DESC[lang];
    const canonical = `${SITE_URL}${pathname}`;

    document.title = title;
    document.documentElement.lang = lang;

    setMeta('description', desc);
    setMeta('og:title', title, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:url', canonical, 'property');
    setMeta('og:locale', lang === 'de' ? 'de_DE' : 'en_US', 'property');
    setMeta('og:image', `${SITE_URL}/og-image.svg`, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', desc);
    setMeta('twitter:image', `${SITE_URL}/og-image.svg`);

    setLink('canonical', canonical);
    setLink('alternate', canonical, lang === 'de' ? 'de' : 'en');
    setLink('alternate', canonical, lang === 'de' ? 'en' : 'de');
    setLink('alternate', `${SITE_URL}${pathname}`, 'x-default');

    setJsonLd('person', {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: PERSON_NAME,
      url: SITE_URL,
      jobTitle: lang === 'de' ? 'KI-Engineer & Trainer' : 'AI Engineer & Trainer',
      worksFor: { '@type': 'Organization', name: 'ZIAN AI CONCEPTS' },
      sameAs: [],
    });

    setJsonLd('service', {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: 'ZIAN AI CONCEPTS',
      url: SITE_URL,
      image: `${SITE_URL}/og-image.svg`,
      description: desc,
      founder: { '@type': 'Person', name: PERSON_NAME },
      areaServed: lang === 'de' ? 'DE' : 'Worldwide',
      knowsAbout: ['Artificial Intelligence', 'Web Development', 'App Development', 'AI Training', 'Enterprise AI Integration'],
    });
  }, [pathname, lang]);

  return null;
}
