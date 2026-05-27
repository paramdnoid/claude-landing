import Hero from '../components/sections/Hero';
import Manifesto from '../components/sections/Manifesto';
import Capabilities from '../components/sections/Capabilities';
import Process from '../components/sections/Process';
import Contact from '../components/sections/Contact';

export default function Home() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Capabilities />
      <Process />
      <Contact />
    </>
  );
}
