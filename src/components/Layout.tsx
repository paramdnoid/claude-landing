import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-screen">
      <a href="#main" className="skip-link">{t('nav.skipToContent')}</a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
