import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

export function FeatureSteps({
  features,
  className,
  title = "How It Works",
  autoPlayInterval = 4000,
}) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (progress < 100) {
        setProgress((prev) => prev + 100 / (autoPlayInterval / 100));
      } else {
        setCurrentFeature((prev) => (prev + 1) % features.length);
        setProgress(0);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [progress, features.length, autoPlayInterval]);

  const handleStepClick = (index) => {
    setCurrentFeature(index);
    setProgress(0);
  };

  return (
    <div className={cn("py-24 px-6 md:px-12", className)}>
      <div className="max-w-7xl mx-auto w-full">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-1.5 text-xs uppercase tracking-wider text-rose-400 ring-1 ring-rose-500/20 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            Simple Process
          </span>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {title}
          </h2>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Steps List */}
          <div className="order-2 lg:order-1 space-y-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={cn(
                  "flex items-start gap-6 p-6 rounded-xl cursor-pointer transition-all duration-300",
                  index === currentFeature
                    ? "bg-white/10 border border-white/20"
                    : "bg-white/5 border border-transparent hover:bg-white/[0.07]"
                )}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: index === currentFeature ? 1 : 0.5 }}
                transition={{ duration: 0.3 }}
                onClick={() => handleStepClick(index)}
              >
                {/* Step Number/Check */}
                <div className="relative shrink-0">
                  <motion.div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      index === currentFeature
                        ? "bg-gradient-to-br from-rose-500 to-violet-500 border-rose-400 text-white"
                        : index < currentFeature
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                        : "bg-white/5 border-white/20 text-white/60"
                    )}
                  >
                    {index < currentFeature ? (
                      <span className="text-lg font-bold">✓</span>
                    ) : (
                      <span className="text-lg font-semibold">{index + 1}</span>
                    )}
                  </motion.div>

                  {/* Progress Bar for Active Step */}
                  {index === currentFeature && (
                    <div className="absolute -bottom-1 left-0 right-0 h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-rose-500 to-violet-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3
                    className="text-xl md:text-2xl font-semibold text-white mb-2"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {feature.title || feature.step}
                  </h3>
                  <p className="text-sm md:text-base text-white/60 leading-relaxed">
                    {feature.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Image Display */}
          <div className="order-1 lg:order-2 relative h-[250px] md:h-[350px] lg:h-[450px] overflow-hidden rounded-2xl bg-white/5 border border-white/10">
            <AnimatePresence mode="wait">
              {features.map(
                (feature, index) =>
                  index === currentFeature && (
                    <motion.div
                      key={index}
                      className="absolute inset-0 rounded-2xl overflow-hidden"
                      initial={{ y: 50, opacity: 0, scale: 0.95 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -50, opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                      <img
                        src={feature.image}
                        alt={feature.step}
                        className="w-full h-full object-cover"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                      {/* Step Badge */}
                      <div className="absolute bottom-6 left-6 right-6">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm text-white/90 ring-1 ring-white/20">
                          <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                          {feature.step}
                        </span>
                      </div>
                    </motion.div>
                  )
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
