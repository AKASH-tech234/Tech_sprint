import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Camera, ArrowRight } from "lucide-react";
import { Logo } from "../ui/Logo";

export function HeroSection() {
  // Symmetric pillar heights (percent). Tall at edges, low at center - representing city skyline
  const pillars = [
    92, 84, 78, 70, 62, 54, 46, 34, 18, 34, 46, 54, 62, 70, 78, 84, 92,
  ];

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes subtlePulse {
            0%, 100% {
              opacity: 0.8;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.03);
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          
          .animate-fadeInUp {
            animation: fadeInUp 0.8s ease-out forwards;
          }

          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}
      </style>

      <section className="relative isolate min-h-screen overflow-hidden bg-[#0a0a0a] text-white pt-24">
        {/* ================== BACKGROUND ================== */}
        {/* Luminous elliptical gradients - Web3 Rose/Violet theme */}
        <div
          aria-hidden
          className="absolute inset-0 -z-30"
          style={{
            backgroundImage: [
              // Main central dome/band (rose to violet gradient)
              "radial-gradient(80% 55% at 50% 52%, rgba(244,63,94,0.45) 0%, rgba(236,72,153,0.46) 27%, rgba(139,92,246,0.38) 47%, rgba(99,102,241,0.45) 60%, rgba(8,12,12,0.92) 78%, rgba(10,10,10,1) 88%)",
              // Warm sweep from top-left (pink)
              "radial-gradient(85% 60% at 14% 0%, rgba(251,113,133,0.55) 0%, rgba(244,63,94,0.48) 30%, rgba(48,28,24,0.0) 64%)",
              // Cool rim on top-right (violet)
              "radial-gradient(70% 50% at 86% 22%, rgba(139,92,246,0.40) 0%, rgba(16,28,28,0.0) 55%)",
              // Soft top vignette
              "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0) 40%)",
            ].join(","),
            backgroundColor: "#0a0a0a",
          }}
        />

        {/* Vignette corners for extra contrast */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-[radial-gradient(140%_120%_at_50%_0%,transparent_60%,rgba(10,10,10,0.85))]"
        />

        {/* Grid overlay: vertical columns + subtle curved horizontal arcs */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 mix-blend-screen opacity-20"
          style={{
            backgroundImage: [
              "repeating-linear-gradient(90deg, rgba(244,63,94,0.09) 0 1px, transparent 1px 96px)",
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 24px)",
              "repeating-radial-gradient(80% 55% at 50% 52%, rgba(139,92,246,0.06) 0 1px, transparent 1px 120px)",
            ].join(","),
            backgroundBlendMode: "screen",
          }}
        />

        {/* ================== HERO CONTENT ================== */}
        <div className="relative z-10 mx-auto grid w-full max-w-5xl place-items-center px-6 py-16 md:py-24 lg:py-28">
          <div
            className={`mx-auto text-center ${
              isMounted ? "animate-fadeInUp" : "opacity-0"
            }`}
          >
            {/* Badge */}
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-[11px] uppercase tracking-wider text-white/70 ring-1 ring-white/10 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              Civic Tech Platform
            </span>

            {/* Headline - Premium Font */}
            <h1
              style={{ animationDelay: "200ms" }}
              className={`mt-8 text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight ${
                isMounted ? "animate-fadeInUp" : "opacity-0"
              }`}
            >
              Your Voice,{" "}
              <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
                Your City
              </span>
              <br />
              <span className="text-white/90">Transformed</span>
            </h1>

            {/* Subheadline */}
            <p
              style={{ animationDelay: "300ms" }}
              className={`mx-auto mt-6 max-w-2xl text-balance text-white/70 md:text-lg lg:text-xl leading-relaxed ${
                isMounted ? "animate-fadeInUp" : "opacity-0"
              }`}
            >
              Report civic issues in seconds with AI-powered routing. Track
              resolutions in real-time. Build transparent, accountable
              communities together.
            </p>

            {/* CTA Buttons - Web3 Style */}
            <div
              style={{ animationDelay: "400ms" }}
              className={`mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row ${
                isMounted ? "animate-fadeInUp" : "opacity-0"
              }`}
            >
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-white/20 transition-all hover:scale-105 hover:shadow-white/30"
              >
                <Camera className="h-5 w-5" />
                Report an Issue
                <ArrowRight className="h-4 w-4" />
              </Link>
             
            </div>
          </div>
        </div>

        

        {/* ================== FOREGROUND ================== */}
        {/* Center-bottom rectangular glow with pulse animation */}
        <div
          className="pointer-events-none absolute bottom-[128px] left-1/2 z-0 h-36 w-28 -translate-x-1/2 rounded-md bg-gradient-to-b from-rose-500/75 via-violet-500/40 to-transparent"
          style={{ animation: "subtlePulse 6s ease-in-out infinite" }}
        />

        {/* Stepped pillars silhouette - City Skyline */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[54vh]">
          {/* dark fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent" />
          {/* bars */}
          <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-px px-[2px]">
            {pillars.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-[#0a0a0a] relative overflow-hidden"
                style={{
                  height: isMounted ? `${h}%` : "0%",
                  transition: "height 1s ease-in-out",
                  transitionDelay: `${
                    Math.abs(i - Math.floor(pillars.length / 2)) * 60
                  }ms`,
                }}
              >
                {/* Window lights effect */}
                <div className="absolute inset-0 opacity-40">
                  {[...Array(Math.floor(h / 15))].map((_, j) => (
                    <div
                      key={j}
                      className="absolute w-1 h-1 bg-rose-500/60 rounded-full"
                      style={{
                        left: `${30 + Math.random() * 40}%`,
                        top: `${10 + j * 15}%`,
                        opacity: Math.random() > 0.5 ? 0.6 : 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Icons */}
        <div
          className="absolute top-1/4 left-10 hidden lg:block animate-float"
          style={{ animationDelay: "0s" }}
        >
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 backdrop-blur-sm border border-rose-500/30 flex items-center justify-center shadow-lg shadow-rose-500/10">
            <Camera className="h-7 w-7 text-rose-500" />
          </div>
        </div>
        <div
          className="absolute top-1/3 right-16 hidden lg:block animate-float"
          style={{ animationDelay: "1s" }}
        >
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 backdrop-blur-sm border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-500/10">
            <MapPin className="h-8 w-8 text-violet-500" />
          </div>
        </div>
      </section>
    </>
  );
}
