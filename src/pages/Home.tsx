import Hero from '../components/sections/Hero';
import AskAndre from '../components/sections/AskAndre';
import About from '../components/sections/About';
import Capabilities from '../components/sections/Capabilities';
import Process from '../components/sections/Process';
import TechStack from '../components/sections/TechStack';
import Contact from '../components/sections/Contact';

export default function Home() {
  return (
    <>
      <Hero />
      <AskAndre />
      <About />
      <Capabilities />
      <Process />
      <TechStack />
      <Contact />
    </>
  );
}
