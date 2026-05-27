import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Layout from './components/Layout';
import Home from './pages/Home';
import Impressum from './pages/Impressum';
import Datenschutz from './pages/Datenschutz';
import Cursor from './components/Cursor';
import CookieBanner from './components/CookieBanner';
import Seo from './components/Seo';
import PageTransition from './components/PageTransition';
import Loader from './components/Loader';
import i18n from './lib/i18n';
import { destroySmoothScroll, getLenis, initSmoothScroll } from './lib/smoothScroll';
import { initAnalytics } from './lib/analytics';

const SUPPORTED_LANGS = ['de', 'en'] as const;
type Lang = (typeof SUPPORTED_LANGS)[number];

function isLang(value: string | undefined): value is Lang {
  return value === 'de' || value === 'en';
}

function ScrollRefresh({ ready }: { ready: boolean }) {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!ready) return;
    const hash = window.location.hash.slice(1);
    const target = hash ? document.getElementById(hash) : null;
    // Defer one rAF so this runs after App's [loaded] effect calls lenis.start();
    // child effects fire before parent effects, so a direct call here would hit a
    // stopped Lenis on initial mount and be silently discarded.
    let innerRaf = 0;
    const raf = requestAnimationFrame(() => {
      if (target) {
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(target, { offset: -64, immediate: true });
        else target.scrollIntoView({ block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
      innerRaf = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    return () => {
      cancelAnimationFrame(raf);
      if (innerRaf) cancelAnimationFrame(innerRaf);
    };
  }, [pathname, ready]);
  return null;
}

function RootRedirect() {
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem('zian.lang') : null;
  const browserLang: Lang =
    typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('en') ? 'en' : 'de';
  const lang: Lang = isLang(stored ?? undefined) ? (stored as Lang) : browserLang;
  return <Navigate to={`/${lang}`} replace />;
}

function LocaleGate({ children }: { children: ReactNode }) {
  const { lang } = useParams<{ lang: string }>();
  const valid = isLang(lang);

  useEffect(() => {
    if (!valid || !lang) return;
    if (i18n.language !== lang) {
      void i18n.changeLanguage(lang);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang, valid]);

  if (!valid) {
    return <Navigate to="/de" replace />;
  }

  return <>{children}</>;
}

function LocaleLayout({ ready }: { ready: boolean }) {
  return (
    <Layout>
      <ScrollRefresh ready={ready} />
      <PageTransition>
        <Outlet />
      </PageTransition>
    </Layout>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    initSmoothScroll();
    initAnalytics();
    return () => destroySmoothScroll();
  }, []);

  useEffect(() => {
    const lenis = getLenis();
    if (!loaded) {
      lenis?.stop();
      document.documentElement.classList.add('lenis-stopped');
      return;
    }
    lenis?.start();
    document.documentElement.classList.remove('lenis-stopped');
    // Single safe-mode refresh after both pinned children have mounted via
    // useLayoutEffect. `refresh(true)` recalculates every ScrollTrigger in
    // refreshPriority order, so SelectedWork (priority 1) inserts its pin-spacer
    // before Process measures its documentTop.
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => ScrollTrigger.refresh(true));
    });
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [loaded]);

  return (
    <>
      <Seo />
      <Cursor />
      <Loader onDone={() => setLoaded(true)} />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route
          path="/:lang"
          element={
            <LocaleGate>
              <LocaleLayout ready={loaded} />
            </LocaleGate>
          }
        >
          <Route index element={<Home />} />
          <Route path="impressum" element={<Impressum />} />
          <Route path="datenschutz" element={<Datenschutz />} />
        </Route>
        <Route path="*" element={<Navigate to="/de" replace />} />
      </Routes>
      <CookieBanner />
    </>
  );
}
