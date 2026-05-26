import { useEffect } from 'react';
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
import { destroySmoothScroll, initSmoothScroll } from './lib/smoothScroll';
import { initAnalytics } from './lib/analytics';

function ScrollRefresh() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [pathname]);
  return null;
}

export default function App() {
  useEffect(() => {
    initSmoothScroll();
    initAnalytics();
    return () => destroySmoothScroll();
  }, []);

  return (
    <>
      <Seo />
      <Cursor />
      <Layout>
        <ScrollRefresh />
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
