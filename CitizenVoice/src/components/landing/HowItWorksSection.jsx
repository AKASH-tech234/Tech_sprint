// Merged How It Works + Features Section with Animations
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { 
  MessageSquare, 
  MapPin, 
  Users, 
  CheckCircle2,
  Bell,
  TrendingUp,
  Shield,
  Zap,
  Camera,
  Sparkles,
  BarChart3
} from "lucide-react";
import RadialOrbitalTimeline from "../ui/radial-orbital-timeline";

export function HowItWorksSection() {
  const sectionRef = useRef(null);
  
  // Scroll-based animation for the entire section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Timeline data for RadialOrbitalTimeline
  const timelineData = [
    {
      id: 1,
      title: "One-Tap Reporting",
      date: "Step 01",
      content: "Snap a photo, and GPS automatically captures your location. Report civic issues in under 2 minutes with zero friction.",
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
      content: "Gemini AI instantly categorizes your issue and routes it to the correct municipal department. 85%+ accuracy guaranteed.",
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
      content: "See all reported issues on an interactive map. Track status, resolution times, and identify problem hotspots in your area.",
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
      content: "Officials get a powerful dashboard to track assigned issues, monitor team performance, and analyze resolution metrics.",
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
      content: "Citizens verify resolutions with before/after photos. Crowdsourced accountability ensures issues are truly fixed.",
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
      content: "Get instant notifications when your issue is acknowledged, assigned, or resolved. Never be left in the dark again.",
      category: "Notifications",
      icon: Bell,
      relatedIds: [5],
      status: "pending",
      energy: 25,
    },
  ];

  const steps = [
    {
      number: "01",
      icon: MessageSquare,
      title: "Report Issues",
      description: "Spot a problem? Report it instantly with photos and location details.",
      features: ["Photo upload", "GPS location", "Category selection"]
    },
    {
      number: "02",
      icon: MapPin,
      title: "Track Progress",
      description: "Monitor your report in real-time as officials take action.",
      features: ["Live updates", "Status tracking", "Official responses"]
    },
    {
      number: "03",
      icon: Users,
      title: "Community Engagement",
      description: "Upvote issues, collaborate with neighbors, and strengthen your community.",
      features: ["Upvote system", "Community validation", "Collaborative action"]
    },
    {
      number: "04",
      icon: CheckCircle2,
      title: "Resolution & Impact",
      description: "See your impact as issues get resolved and communities improve.",
      features: ["Resolution tracking", "Community stats", "Impact metrics"]
    }
  ];

  const keyFeatures = [
    {
      icon: Bell,
      title: "Real-time Notifications",
      description: "Stay updated on issue progress"
    },
    {
      icon: TrendingUp,
      title: "Analytics Dashboard",
      description: "Track community engagement metrics"
    },
    {
      icon: Shield,
      title: "Verified Officials",
      description: "Connect with authenticated authorities"
    },
    {
      icon: Zap,
      title: "Instant Response",
      description: "Fast-track urgent community issues"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const featureVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <section ref={sectionRef} className="relative py-24 overflow-hidden bg-gradient-to-b from-black via-black to-black">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)]" />
      
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-rose-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-violet-500/20 rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-block mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-violet-500/10 border border-white/10">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-violet-400 font-semibold text-sm tracking-wider">
              HOW IT WORKS
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/80">
              Simple Steps to
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-violet-400">
              Transform Your Community
            </span>
          </h2>
          
          <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto">
            From reporting issues to seeing real change—your voice drives community improvement
          </p>
        </motion.div>

        {/* Main Steps Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
        >
          {steps.map((step, index) => {
            const cardRef = useRef(null);
            const { scrollYProgress: cardProgress } = useScroll({
              target: cardRef,
              offset: ["start end", "end start"]
            });
            
            const scale = useTransform(cardProgress, [0, 0.5, 1], [0.85, 1.05, 0.85]);
            const opacity = useTransform(cardProgress, [0, 0.3, 0.7, 1], [0.5, 1, 1, 0.5]);
            
            return (
              <motion.div
                key={index}
                ref={cardRef}
                variants={itemVariants}
                style={{ scale, opacity }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative"
              >
              {/* Connecting Line (hidden on last item and mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-20 left-full w-full h-[2px] bg-gradient-to-r from-white/20 to-transparent" />
              )}

              {/* Card */}
              <div className="relative h-full p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden group-hover:border-white/20 transition-all duration-300">
                {/* Hover Gradient Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-pink-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Step Number */}
                  <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-rose-500/30 via-pink-500/30 to-violet-500/30 mb-4">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="mb-6 inline-flex p-4 rounded-xl bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-violet-500/10 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-8 h-8 text-rose-400" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-400 group-hover:via-pink-400 group-hover:to-violet-400 transition-all duration-300">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-white/60 mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Feature Pills */}
                  <div className="flex flex-wrap gap-2">
                    {step.features.map((feature, fIndex) => (
                      <span
                        key={fIndex}
                        className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-white/70"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
            );
          })}
        </motion.div>

        {/* Key Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h3 className="text-3xl font-bold text-center mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/80">
              Powerful Features
            </span>
          </h3>
          <p className="text-white/60 text-center max-w-2xl mx-auto mb-12">
            Click on each node to explore our interconnected feature ecosystem
          </p>
        </motion.div>

        {/* Radial Orbital Timeline */}
        <ScrollExpandSection>
          <RadialOrbitalTimeline timelineData={timelineData} />
        </ScrollExpandSection>

        {/* Additional Feature Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {keyFeatures.map((feature, index) => {
            const featureRef = useRef(null);
            const { scrollYProgress: featureProgress } = useScroll({
              target: featureRef,
              offset: ["start end", "end start"]
            });
            
            const featureScale = useTransform(featureProgress, [0, 0.5, 1], [0.9, 1.08, 0.9]);
            const featureOpacity = useTransform(featureProgress, [0, 0.3, 0.7, 1], [0.4, 1, 1, 0.4]);
            
            return (
              <motion.div
                key={index}
                ref={featureRef}
                variants={featureVariants}
                style={{ scale: featureScale, opacity: featureOpacity }}
                whileHover={{ scale: 1.12, transition: { duration: 0.2 } }}
                className="group relative p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
              >
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-violet-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                {/* Icon */}
                <div className="mb-4 inline-flex p-3 rounded-lg bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-violet-500/10 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-rose-400" />
                </div>

                {/* Title */}
                <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-400 group-hover:to-violet-400 transition-all duration-300">
                  {feature.title}
                </h4>

                {/* Description */}
                <p className="text-white/60 text-sm">
                  {feature.description}
                </p>
              </div>
            </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-violet-400 border-2 border-black" />
              ))}
            </div>
            <span className="text-white/80 text-sm font-medium">
              Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-violet-400 font-bold">10,000+</span> active community members
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Scroll Expand Component for Timeline
function ScrollExpandSection({ children }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const scale = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0.8, 1.1, 1.1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.3, 1, 1, 0.3]);
  
  return (
    <motion.div
      ref={ref}
      style={{ scale, opacity }}
      className="mb-20"
      transition={{ type: "spring", stiffness: 100, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}
