import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
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
import { destroySmoothScroll, getLenis, initSmoothScroll } from './lib/smoothScroll';
import { initAnalytics } from './lib/analytics';

function ScrollRefresh({ ready }: { ready: boolean }) {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!ready) return;
    const hash = window.location.hash.slice(1);
    const target = hash ? document.getElementById(hash) : null;
    if (target) {
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(target, { offset: -64, immediate: true });
      else target.scrollIntoView({ block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [pathname, ready]);
  return null;
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
    } else {
      lenis?.start();
      document.documentElement.classList.remove('lenis-stopped');
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  }, [loaded]);

  return (
    <>
      <Seo />
      <Cursor />
      <Loader onDone={() => setLoaded(true)} />
      <Layout>
        <ScrollRefresh ready={loaded} />
        <PageTransition>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/datenschutz" element={<Datenschutz />} />
          </Routes>
        </PageTransition>
      </Layout>
      <CookieBanner />
    </>
  );
}
