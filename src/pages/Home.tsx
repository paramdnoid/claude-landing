import Hero from '../components/sections/Hero';
import Manifesto from '../components/sections/Manifesto';
import SelectedWork from '../components/sections/SelectedWork';
import Capabilities from '../components/sections/Capabilities';
import Process from '../components/sections/Process';
import Marquee from '../components/sections/Marquee';
import Contact from '../components/sections/Contact';

export default function Home() {
  return (
    <>
      <Hero />
      <Manifesto />
      <SelectedWork />
      <Capabilities />
      <Process />
      <Marquee />
      <Contact />
    </>
  );
}
