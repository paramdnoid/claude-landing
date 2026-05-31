import Hero from '../components/sections/Hero';
import Manifesto from '../components/sections/Manifesto';
import SelectedWork from '../components/sections/SelectedWork';
import Capabilities from '../components/sections/Capabilities';
import Process from '../components/sections/Process';
import Marquee from '../components/sections/Marquee';
import Connect from '../components/sections/Connect';
import SectionRail from '../components/SectionRail';

export default function Home() {
  return (
    <>
      <SectionRail />
      <Hero />
      <Manifesto />
      <SelectedWork />
      <Capabilities />
      <Process />
      <Marquee />
      <Connect />
    </>
  );
}
