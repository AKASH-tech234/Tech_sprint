import React from "react";
import {
  MapPin,
  Twitter,
  Linkedin,
  Github,
  Instagram,
  Mail,
  Phone,
  Heart,
} from "lucide-react";
import { Logo } from "../ui/Logo";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "Municipal Dashboard", href: "#dashboard" },
      { label: "API Access", href: "#api" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#docs" },
      { label: "Help Center", href: "#help" },
      { label: "Community", href: "#community" },
      { label: "Blog", href: "#blog" },
      { label: "Case Studies", href: "#cases" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "#about" },
      { label: "Careers", href: "#careers" },
      { label: "Press Kit", href: "#press" },
      { label: "Partners", href: "#partners" },
      { label: "Contact", href: "#contact" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Terms of Service", href: "#terms" },
      { label: "Cookie Policy", href: "#cookies" },
      { label: "Data Security", href: "#security" },
    ],
  },
};

const socialLinks = [
  { icon: Twitter, href: "#twitter", label: "Twitter" },
  { icon: Linkedin, href: "#linkedin", label: "LinkedIn" },
  { icon: Github, href: "#github", label: "GitHub" },
  { icon: Instagram, href: "#instagram", label: "Instagram" },
];

export function Footer() {
  return (
    <footer className="relative bg-[#0a0a0a] border-t border-white/10">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <Logo size="default" />
            </div>
            <p className="text-sm text-white/60 mb-6 leading-relaxed">
              Empowering citizens to build better communities through
              transparent civic engagement.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a
                href="mailto:hello@citizenvoice.in"
                className="flex items-center gap-3 text-sm text-white/60 hover:text-rose-500 transition-colors"
              >
                <Mail className="h-4 w-4" />
                hello@citizenvoice.in
              </a>
              <a
                href="tel:+911234567890"
                className="flex items-center gap-3 text-sm text-white/60 hover:text-rose-500 transition-colors"
              >
                <Phone className="h-4 w-4" />
                +91 123 456 7890
              </a>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/60 transition-all hover:bg-rose-500/20 hover:text-rose-500"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-4 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {Object.values(footerLinks).map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-white mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-white/60 hover:text-rose-500 transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">
                Stay Updated
              </h3>
              <p className="text-sm text-white/60">
                Get the latest updates on civic tech and community impact.
              </p>
            </div>
            <form className="flex gap-3 max-w-md w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50"
              />
              <button
                type="submit"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-white/20 transition-all hover:scale-105"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/50">
              © {new Date().getFullYear()} CitizenVoice. All rights reserved.
            </p>
            <p className="text-sm text-white/50 flex items-center gap-1">
              Made with{" "}
              <Heart className="h-4 w-4 text-rose-500 fill-rose-500" /> for
              Indian Cities
            </p>
            <div className="flex items-center gap-4 text-sm text-white/50">
              <span>🇮🇳 India</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span>English</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
