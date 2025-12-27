import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Camera, Sparkles, CheckCircle } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative py-24 bg-[#0a0a0a] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-violet-500/20 border border-white/10 p-8 md:p-12 lg:p-16 overflow-hidden">
          {/* Decorative Grid */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiLz48cGF0aCBkPSJNNDAgMEgwdjQwaDQwVjB6TTEgMWgzOHYzOEgxVjF6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-50" />

          {/* Floating Elements */}
          <div className="absolute top-8 right-8 h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-500/30 to-pink-500/30 backdrop-blur-sm border border-white/10 flex items-center justify-center animate-pulse">
            <Camera className="h-8 w-8 text-rose-500" />
          </div>
          <div
            className="absolute bottom-8 left-8 h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/30 to-indigo-500/30 backdrop-blur-sm border border-white/10 flex items-center justify-center animate-pulse"
            style={{ animationDelay: "1s" }}
          >
            <Sparkles className="h-6 w-6 text-violet-500" />
          </div>

          {/* Content */}
          <div className="relative text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
              Ready to Transform{" "}
              <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
                Your Community?
              </span>
            </h2>

            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Join thousands of citizens and officials already making their
              cities better. Start reporting issues today and see real change
              happen.
            </p>

            {/* Benefits List */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {[
                "Free for citizens",
                "No app download required",
                "2-minute setup",
              ].map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-2 text-sm text-white/70"
                >
                  <CheckCircle className="h-4 w-4 text-rose-500" />
                  {benefit}
                </div>
              ))}
            </div>

            {/* CTA Buttons - Web3 Style */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-white/20 transition-all hover:scale-105 hover:shadow-white/30"
              >
                Start Reporting Now
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
             
            </div>

            {/* Trust Badge */}
            <p className="mt-8 text-sm text-white/50">
              Trusted by{" "}
              <span className="text-white/70 font-medium">
                75+ municipal bodies
              </span>{" "}
              across India
            </p>
          </div>
        </div>

        {/* For Officials CTA */}
        <div className="mt-12 text-center">
          <p className="text-white/60 mb-4">Are you a municipal official?</p>
          <a
            href="#officials"
            className="inline-flex items-center gap-2 text-rose-500 hover:text-pink-500 transition-colors font-medium"
          >
            Learn about our Municipal Dashboard
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
