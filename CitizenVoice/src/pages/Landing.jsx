import React from "react";
import {
  HeroSection,
  HowItWorksSection,
  CardsSection,
  CTASection,
  Footer,
} from "../components/landing";
import { GlassHeader } from "../components/ui";

export function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <GlassHeader />
      <HeroSection />
      <HowItWorksSection />
      <CardsSection />
      <CTASection />
      <Footer />
    </div>
  );
}

export default Landing;
