import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

// SVG Filter for Glass Effect
const GlassFilter = () => (
  <svg style={{ display: "none" }}>
    <filter
      id="glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.001 0.005"
        numOctaves="1"
        seed="17"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="5"
        specularConstant="1"
        specularExponent="100"
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x="-200" y="-200" z="300" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="50"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);

export function GlassHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    "Features",
    "How It Works",
    "Impact",
    "For Officials",
    "About",
  ];

  return (
    <>
      <GlassFilter />

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? "py-3" : "py-6"
        }`}
      >
        <div
          className={`mx-auto max-w-7xl px-6 md:px-8 transition-all duration-500 ${
            isScrolled ? "" : ""
          }`}
        >
          <div
            className={`relative flex items-center justify-between transition-all duration-500 ${
              isScrolled ? "rounded-2xl px-6 py-3" : "px-0 py-0"
            }`}
            style={
              isScrolled
                ? {
                    boxShadow:
                      "0 6px 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 0, 0, 0.1)",
                  }
                : {}
            }
          >
            {/* Glass Layers - Only when scrolled */}
            {isScrolled && (
              <>
                <div
                  className="absolute inset-0 z-0 overflow-hidden rounded-2xl"
                  style={{
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                />
                <div
                  className="absolute inset-0 z-10 rounded-2xl"
                  style={{ background: "rgba(0, 0, 0, 0.4)" }}
                />
                <div
                  className="absolute inset-0 z-20 rounded-2xl overflow-hidden"
                  style={{
                    boxShadow:
                      "inset 1px 1px 1px 0 rgba(255, 255, 255, 0.1), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.05)",
                  }}
                />
              </>
            )}

            {/* Content */}
            <div className="relative z-30 flex items-center justify-between w-full">
              {/* Logo */}
              <Link to="/">
                <Logo size={isScrolled ? "small" : "default"} />
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-8">
                {navItems.map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-sm text-white/70 hover:text-white transition-colors font-medium"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {item}
                  </a>
                ))}
              </nav>

              {/* Desktop CTA */}
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 text-sm font-semibold text-black bg-white rounded-full shadow-lg shadow-white/20 hover:scale-105 transition-all"
                >
                  Report Issue
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden relative z-30 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-white" />
                ) : (
                  <Menu className="h-5 w-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden absolute top-full left-0 right-0 mt-2 mx-6"
            style={{
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                backdropFilter: "blur(12px)",
                background: "rgba(0, 0, 0, 0.8)",
              }}
            >
              <nav className="flex flex-col p-6 gap-4">
                {navItems.map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-white/70 hover:text-white transition-colors py-2 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
                <div className="pt-4 border-t border-white/10">
                  <Link
                    to="/signup"
                    className="block w-full px-5 py-2.5 text-sm font-semibold text-black bg-white rounded-full shadow-lg shadow-white/20 text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Report Issue
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
