import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
