import React, { useEffect, useState, useRef } from "react";
import {
  TrendingUp,
  Users,
  Clock,
  MapPin,
  CheckCircle,
  Building2,
} from "lucide-react";

const stats = [
  {
    icon: MapPin,
    value: 10000,
    suffix: "+",
    label: "Issues Reported",
    description: "Civic issues documented by citizens",
  },
  {
    icon: CheckCircle,
    value: 8500,
    suffix: "+",
    label: "Issues Resolved",
    description: "Problems fixed by municipalities",
  },
  {
    icon: Users,
    value: 50000,
    suffix: "+",
    label: "Active Citizens",
    description: "Community members engaged",
  },
  {
    icon: Building2,
    value: 75,
    suffix: "+",
    label: "Partner Cities",
    description: "Municipalities onboarded",
  },
  {
    icon: Clock,
    value: 72,
    suffix: "%",
    label: "Faster Resolution",
    description: "Compared to traditional methods",
  },
  {
    icon: TrendingUp,
    value: 85,
    suffix: "%",
    label: "AI Accuracy",
    description: "In issue categorization",
  },
];

function AnimatedCounter({ value, suffix, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime;
          const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            setCount(Math.floor(progress * value));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function ImpactSection() {
  return (
    <section
      id="impact"
      className="relative py-24 bg-[#0a0a0a] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(244,63,94,0.15),transparent_60%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-r from-rose-500/5 to-violet-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-1.5 text-xs uppercase tracking-wider text-rose-500 ring-1 ring-rose-500/20 mb-6">
            <TrendingUp className="h-3 w-3" />
            Real Impact
          </span>
          <h2 className="text-3xl font-display font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Measurable{" "}
            <span className="bg-gradient-to-r from-rose-500 to-violet-500 bg-clip-text text-transparent">
              Community Impact
            </span>
          </h2>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            Real numbers from real cities. See how CitizenVoice is transforming
            civic engagement across India.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group relative rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-8 transition-all hover:border-rose-500/30 hover:shadow-xl hover:shadow-rose-500/5"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              {/* Icon */}
              <div className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                <stat.icon className="h-6 w-6 text-rose-500" />
              </div>

              {/* Value */}
              <div className="relative text-4xl font-display font-bold text-white mb-2">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>

              {/* Label */}
              <div className="relative text-lg font-medium text-white mb-1">
                {stat.label}
              </div>

              {/* Description */}
              <div className="relative text-sm text-white/50">
                {stat.description}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonial Highlight */}
        <div className="mt-20 relative">
          <div className="rounded-2xl bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-violet-500/10 border border-white/10 p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face"
                  alt="Municipal Official"
                  className="h-24 w-24 rounded-full object-cover border-4 border-rose-500/30"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <blockquote className="text-xl md:text-2xl font-display font-medium text-white leading-relaxed mb-4">
                  "CitizenVoice reduced our average resolution time from 30 days
                  to just 7 days. The AI routing alone saved us hundreds of
                  man-hours in manual categorization."
                </blockquote>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <span className="font-semibold text-white">
                    Dr. Priya Sharma
                  </span>
                  <span className="hidden md:block text-white/30">•</span>
                  <span className="text-white/60">
                    Municipal Commissioner, Smart City Initiative
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
