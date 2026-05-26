import { getConsent, onConsentChange } from './consent';

const ATTR = 'data-zian-analytics';

function loadScript() {
  const src = import.meta.env.VITE_ANALYTICS_SCRIPT_URL;
  if (!src) return;
  if (document.querySelector(`script[${ATTR}]`)) return;
  const s = document.createElement('script');
  s.src = src;
  s.defer = true;
  s.setAttribute(ATTR, 'true');
  const siteId = import.meta.env.VITE_ANALYTICS_SITE_ID;
  if (siteId) s.setAttribute('data-website-id', siteId);
  const domain = import.meta.env.VITE_ANALYTICS_DOMAIN;
  if (domain) s.setAttribute('data-domain', domain);
  document.head.appendChild(s);
}

function unloadScript() {
  const s = document.querySelector(`script[${ATTR}]`);
  if (s) s.remove();
}

export function initAnalytics() {
  if (typeof window === 'undefined') return;
  if (!import.meta.env.VITE_ANALYTICS_SCRIPT_URL) return;
  if (getConsent() === 'accepted') loadScript();
  onConsentChange((v) => {
    if (v === 'accepted') loadScript();
    else unloadScript();
  });
}
