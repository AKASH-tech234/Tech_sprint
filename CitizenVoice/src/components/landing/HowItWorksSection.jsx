import React, { useState } from "react";
import { Camera, Cpu, Send, CheckCircle, Play, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Camera,
    title: "Snap & Report",
    description:
      "Take a photo of the civic issue. Your GPS location is automatically captured for precise reporting.",
    color: "from-rose-500 to-pink-500",
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI Analysis",
    description:
      "Gemini AI analyzes the image and description, categorizing the issue and determining priority level.",
    color: "from-pink-500 to-violet-500",
  },
  {
    number: "03",
    icon: Send,
    title: "Auto-Route",
    description:
      "The issue is automatically routed to the correct municipal department with all relevant details.",
    color: "from-violet-500 to-indigo-500",
  },
  {
    number: "04",
    icon: CheckCircle,
    title: "Track & Verify",
    description:
      "Monitor progress in real-time and verify resolution with before/after photo comparisons.",
    color: "from-indigo-500 to-blue-500",
  },
];

export function HowItWorksSection() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <section
      id="workflow"
      className="relative py-24 bg-[#0a0a0a] overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.1),transparent_60%)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-1.5 text-xs uppercase tracking-wider text-rose-500 ring-1 ring-rose-500/20 mb-6">
            <ArrowRight className="h-3 w-3" />
            Video Walkthrough
          </span>
          <h2 className="text-3xl font-display font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            See{" "}
            <span className="bg-gradient-to-r from-rose-500 to-violet-500 bg-clip-text text-transparent">
              CitizenVoice
            </span>{" "}
            in Action
          </h2>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            From reporting to resolution in four simple steps. No bureaucracy,
            no confusion.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Video Section */}
          <div className="relative order-2 lg:order-1">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl shadow-black/50">
              {/* Video Placeholder / Embed */}
              {!isVideoPlaying ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
                  {/* Thumbnail with overlay */}
                  <img
                    src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80"
                    alt="CitizenVoice Demo"
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                  {/* Play Button */}
                  <button
                    onClick={() => setIsVideoPlaying(true)}
                    className="relative group z-10"
                  >
                    <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl group-hover:bg-rose-500/30 transition-colors" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-white/20 transition-all group-hover:scale-110">
                      <Play className="h-8 w-8 text-black ml-1" fill="black" />
                    </div>
                  </button>

                  {/* Video Label */}
                  <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Watch Demo
                      </p>
                      <p className="text-xs text-white/60">2 min walkthrough</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                      Live Demo
                    </div>
                  </div>
                </div>
              ) : (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                  title="CitizenVoice Demo Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -left-4 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl" />
            <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
          </div>

          {/* Steps */}
          <div className="order-1 lg:order-2 space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="group relative flex gap-6 rounded-xl bg-white/5 border border-white/10 p-6 transition-all hover:bg-white/10 hover:border-white/20"
              >
                {/* Step Number */}
                <div className="relative shrink-0">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} shadow-lg`}
                  >
                    <step.icon className="h-6 w-6 text-white" />
                  </div>
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-1/2 top-full h-6 w-px -translate-x-1/2 bg-gradient-to-b from-white/30 to-transparent" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`text-sm font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}
                    >
                      Step {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-display font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Hover Arrow */}
                <ArrowRight className="h-5 w-5 text-white/30 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1 self-center" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
