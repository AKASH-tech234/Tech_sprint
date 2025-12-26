import React from "react";
import {
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  CardsSection,
  ImpactSection,
  CTASection,
  Footer,
} from "../components/landing";
import { GlassHeader, FeatureSteps } from "../components/ui";

// Feature Steps Data for How It Works section
const featureStepsData = [
  {
    step: "01",
    title: "Spot an Issue",
    content:
      "See a pothole, broken streetlight, or public safety concern? Open CitizenVoice on your phone and tap 'Report Issue' to get started instantly.",
    image:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=2070",
  },
  {
    step: "02",
    title: "Capture & Describe",
    content:
      "Take a photo, pin the exact location with GPS, and add details. Our AI automatically categorizes and prioritizes your report for faster processing.",
    image:
      "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=2074",
  },
  {
    step: "03",
    title: "Track Progress",
    content:
      "Watch your report move through the system in real-time. Get notifications when it's acknowledged, assigned, and resolved by city officials.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015",
  },
  {
    step: "04",
    title: "See the Impact",
    content:
      "Celebrate when your issue is fixed! View before and after photos, leave feedback, and see how your contribution makes your community better.",
    image:
      "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=2070",
  },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <GlassHeader />
      <HeroSection />
      <FeaturesSection />

      {/* New Feature Steps Section */}
      <section
        id="how-it-works"
        className="py-20 bg-gradient-to-b from-[#0a0a0a] to-[#0d1117]"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white text-center mb-4">
            How It{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-violet-500">
              Works
            </span>
          </h2>
          <p className="text-white/60 text-lg text-center max-w-2xl mx-auto">
            From spotting an issue to seeing it resolved - a seamless journey
            for every citizen
          </p>
        </div>
        <FeatureSteps
          features={featureStepsData}
          autoPlayInterval={5000}
          imageHeight="h-[500px]"
        />
      </section>

      <HowItWorksSection />
      <CardsSection />
      <CTASection />
      <Footer />
    </div>
  );
}

export default Landing;
