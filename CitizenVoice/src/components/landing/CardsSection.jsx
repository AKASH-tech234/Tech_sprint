import React, { useState } from "react";
import { Building2, Users, ShieldCheck, ChevronRight } from "lucide-react";

const cards = [
  {
    id: 1,
    title: "For Citizens",
    subtitle: "Report Issues Instantly",
    description:
      "Snap a photo, describe the issue, and let AI do the rest. Track your reports in real-time and see real change happen.",
    image:
      "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=600&q=80",
    icon: Users,
    features: ["One-tap reporting", "Real-time tracking", "Community updates"],
    color: "from-rose-500 to-pink-500",
    bgGlow: "bg-rose-500/20",
  },
  {
    id: 2,
    title: "For Officials",
    subtitle: "Manage Efficiently",
    description:
      "Get a powerful dashboard to track, assign, and resolve issues. Monitor team performance with detailed analytics.",
    image:
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=80",
    icon: Building2,
    features: ["Smart dashboard", "Team management", "Performance metrics"],
    color: "from-violet-500 to-indigo-500",
    bgGlow: "bg-violet-500/20",
  },
  {
    id: 3,
    title: "For Communities",
    subtitle: "Build Together",
    description:
      "See all issues on a public map. Upvote critical problems, verify resolutions, and hold authorities accountable.",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80",
    icon: ShieldCheck,
    features: [
      "Public transparency",
      "Community voting",
      "Resolution verification",
    ],
    color: "from-pink-500 to-violet-500",
    bgGlow: "bg-pink-500/20",
  },
];

function Card3D({ card }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 25;
    const y = (e.clientY - rect.top - rect.height / 2) / 25;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div
      className="group relative h-full perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative h-full rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden transition-all duration-300 ease-out hover:border-white/20"
        style={{
          transform: isHovered
            ? `rotateY(${
                mousePosition.x
              }deg) rotateX(${-mousePosition.y}deg) scale(1.02)`
            : "rotateY(0deg) rotateX(0deg) scale(1)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Glow Effect */}
        <div
          className={`absolute -inset-px rounded-2xl ${card.bgGlow} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100`}
        />

        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={card.image}
            alt={card.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          {/* Icon Badge */}
          <div
            className={`absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}
          >
            <card.icon className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="relative p-6">
          <span
            className={`text-sm font-medium bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}
          >
            {card.subtitle}
          </span>
          <h3 className="mt-2 text-xl font-display font-bold text-white">
            {card.title}
          </h3>
          <p className="mt-3 text-sm text-white/60 leading-relaxed">
            {card.description}
          </p>

          {/* Features */}
          <ul className="mt-4 space-y-2">
            {card.features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-sm text-white/70"
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${card.color}`}
                />
                {feature}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <a
            href="#learn-more"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white hover:text-rose-500 transition-colors"
          >
            Learn More
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* Shine Effect */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"
          style={{
            background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 55%, transparent 60%)`,
            transform: `translateX(${isHovered ? "100%" : "-100%"})`,
            transition: "transform 0.6s ease-out",
          }}
        />
      </div>
    </div>
  );
}

export function CardsSection() {
  return (
    <section
      id="for-officials"
      className="relative py-24 bg-[#0a0a0a] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.05),transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-1.5 text-xs uppercase tracking-wider text-violet-500 ring-1 ring-violet-500/20 mb-6">
            <Users className="h-3 w-3" />
            For Everyone
          </span>
          <h2 className="text-3xl font-display font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Built for{" "}
            <span className="bg-gradient-to-r from-rose-500 to-violet-500 bg-clip-text text-transparent">
              Every Stakeholder
            </span>
          </h2>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            Whether you're a citizen, official, or community leader,
            CitizenVoice has tools designed for you.
          </p>
        </div>

        {/* 3D Cards Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card3D key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
