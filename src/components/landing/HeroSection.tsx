import { motion } from "framer-motion";
import ParticleHero from "./ParticleHero";
import { ArrowRight, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <ParticleHero />
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-heading font-800 text-foreground leading-tight"
          style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)" }}
        >
          Know Your Carbon.{" "}
          <span className="text-gradient-green">Change Your World.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 text-muted-foreground text-lg md:text-xl max-w-[600px] font-body"
        >
          The most intelligent personal carbon tracker ever built. Beautiful data, brutal honesty, real results.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row gap-4"
        >
          <Link
            to="/log"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-heading font-600 text-base transition-all hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:scale-105"
          >
            Start Tracking Free <ArrowRight size={18} />
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg border border-primary/30 text-primary font-heading font-600 text-base transition-all hover:bg-primary/10 hover:border-primary/50"
          >
            <Eye size={18} /> See the Dashboard
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-10 flex flex-wrap gap-3 justify-center"
        >
          {[
            "🌍 2,400+ users",
            "📉 Avg. -23% emissions in 30 days",
            "⚡ AI-powered insights",
          ].map((pill) => (
            <span
              key={pill}
              className="px-4 py-2 rounded-full glass-card text-sm font-mono text-muted-foreground"
            >
              {pill}
            </span>
          ))}
        </motion.div>

        {/* Dashboard preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16 w-full max-w-3xl"
        >
          <div className="glass-card rounded-xl p-4 border border-primary/20 shadow-[0_0_60px_rgba(34,197,94,0.1)]">
            <div className="flex gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-warning/60" />
              <div className="w-3 h-3 rounded-full bg-primary/60" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card rounded-lg p-4 flex flex-col items-center">
                <span className="text-xs font-mono text-muted-foreground uppercase">This Month</span>
                <span className="text-2xl font-mono font-bold text-primary mt-1">312 kg</span>
                <span className="text-xs font-mono text-primary/60 mt-1">-18% vs last</span>
              </div>
              <div className="glass-card rounded-lg p-4 flex flex-col items-center">
                <span className="text-xs font-mono text-muted-foreground uppercase">Daily Avg</span>
                <span className="text-2xl font-mono font-bold text-foreground mt-1">10.4 kg</span>
                <span className="text-xs font-mono text-chart-amber mt-1">▼ 2.1 kg</span>
              </div>
              <div className="glass-card rounded-lg p-4 flex flex-col items-center">
                <span className="text-xs font-mono text-muted-foreground uppercase">Streak</span>
                <span className="text-2xl font-mono font-bold text-foreground mt-1">14 days</span>
                <span className="text-xs font-mono text-primary mt-1">🔥 personal best</span>
              </div>
            </div>
          </div>
          <div className="h-24 bg-gradient-to-b from-transparent to-background" />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
