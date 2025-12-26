import React from "react";
import {
  Camera,
  Sparkles,
  MapPin,
  BarChart3,
  CheckCircle2,
  Bell,
} from "lucide-react";
import RadialOrbitalTimeline from "../ui/radial-orbital-timeline";

const timelineData = [
  {
    id: 1,
    title: "One-Tap Reporting",
    date: "Step 01",
    content:
      "Snap a photo, and GPS automatically captures your location. Report civic issues in under 2 minutes with zero friction.",
    category: "Reporting",
    icon: Camera,
    relatedIds: [2],
    status: "completed",
    energy: 100,
  },
  {
    id: 2,
    title: "AI Auto-Routing",
    date: "Step 02",
    content:
      "Gemini AI instantly categorizes your issue and routes it to the correct municipal department. 85%+ accuracy guaranteed.",
    category: "AI",
    icon: Sparkles,
    relatedIds: [1, 3],
    status: "completed",
    energy: 90,
  },
  {
    id: 3,
    title: "Public Heat Map",
    date: "Step 03",
    content:
      "See all reported issues on an interactive map. Track status, resolution times, and identify problem hotspots in your area.",
    category: "Visualization",
    icon: MapPin,
    relatedIds: [2, 4],
    status: "in-progress",
    energy: 75,
  },
  {
    id: 4,
    title: "Municipal Dashboard",
    date: "Step 04",
    content:
      "Officials get a powerful dashboard to track assigned issues, monitor team performance, and analyze resolution metrics.",
    category: "Dashboard",
    icon: BarChart3,
    relatedIds: [3, 5],
    status: "in-progress",
    energy: 60,
  },
  {
    id: 5,
    title: "Community Verification",
    date: "Step 05",
    content:
      "Citizens verify resolutions with before/after photos. Crowdsourced accountability ensures issues are truly fixed.",
    category: "Verification",
    icon: CheckCircle2,
    relatedIds: [4, 6],
    status: "pending",
    energy: 40,
  },
  {
    id: 6,
    title: "Real-Time Updates",
    date: "Step 06",
    content:
      "Get instant notifications when your issue is acknowledged, assigned, or resolved. Never be left in the dark again.",
    category: "Notifications",
    icon: Bell,
    relatedIds: [5],
    status: "pending",
    energy: 25,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 bg-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.08),transparent_70%)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />

      {/* Red/Violet glow effects like MoraAI */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs uppercase tracking-wider text-white/70 ring-1 ring-white/10 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            Powerful Features
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-rose-300 via-pink-300 to-violet-300 bg-clip-text text-transparent">
              Transform Your City
            </span>
          </h2>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            Click on each node to explore our interconnected feature ecosystem.
            Watch how each capability connects to create a seamless civic
            engagement platform.
          </p>
        </div>

        {/* Radial Orbital Timeline */}
        <RadialOrbitalTimeline timelineData={timelineData} />

        {/* Bottom info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-white/40">
            Click on nodes to expand • Connected nodes will pulse • Click
            outside to reset
          </p>
        </div>
      </div>
    </section>
  );
}
