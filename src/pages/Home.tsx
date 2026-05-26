import Hero from '../components/sections/Hero';
import ClientLogos from '../components/sections/ClientLogos';
import About from '../components/sections/About';
import Process from '../components/sections/Process';
import Showcase from '../components/sections/Showcase';
import Contact from '../components/sections/Contact';

export default function Home() {
  return (
    <>
      <Hero />
      <ClientLogos />
      <About />
      <Process />
      <Showcase />
      <Contact />
    </>
  );
}
