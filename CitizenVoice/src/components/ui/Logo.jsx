import React from "react";

export function Logo({ size = "default", showText = true }) {
  const sizeClasses = {
    small: "h-8",
    default: "h-10",
    large: "h-14",
  };

  const textSizes = {
    small: "text-sm",
    default: "text-base",
    large: "text-lg",
  };

  return (
    <div className="flex items-center gap-2">
      {/* Geometric Octagon Logo SVG - matching uploaded image */}
      <div className={`relative ${sizeClasses[size]}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-auto"
        >
          {/* Outer Octagon */}
          <polygon
            points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30"
            fill="none"
            stroke="white"
            strokeWidth="4"
          />
          {/* Inner Octagon */}
          <polygon
            points="35,18 65,18 82,35 82,65 65,82 35,82 18,65 18,35"
            fill="none"
            stroke="white"
            strokeWidth="3"
          />
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <span
          className={`${textSizes[size]} font-bold tracking-widest text-white uppercase`}
          style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.15em" }}
        >
          CITIZEN VOICE
        </span>
      )}
    </div>
  );
}
