import { motion } from "framer-motion";
import CountUp from "./CountUp";

const CarbonOrb = () => {
  const total = 312;
  const target = 350;
  const ratio = total / target;
  const progress = ratio * 100;
  const color = ratio < 0.8 ? "text-primary" : ratio <= 1 ? "text-chart-amber" : "text-destructive";
  const strokeColor = ratio < 0.8 ? "hsl(142 71% 45%)" : ratio <= 1 ? "hsl(45 93% 47%)" : "hsl(0 84% 60%)";
  const circumference = 2 * Math.PI * 120;

  return (
    <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center h-full">
      <span className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest mb-4">
        This Month
      </span>

      <motion.div
        className="relative w-[240px] h-[240px] md:w-[280px] md:h-[280px] flex items-center justify-center"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Inner radial glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: "60%",
            height: "60%",
            background: `radial-gradient(circle, hsl(142 71% 45% / 0.12) 0%, transparent 70%)`,
          }}
        />

        {/* Outer dashed rotating ring */}
        <motion.svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 300 300"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <circle
            cx="150"
            cy="150"
            r="142"
            fill="none"
            stroke="hsl(142 71% 45% / 0.15)"
            strokeWidth="1"
            strokeDasharray="6 10"
          />
        </motion.svg>

        {/* Middle progress arc */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 300 300">
          <circle
            cx="150"
            cy="150"
            r="120"
            fill="none"
            stroke="hsl(142 71% 45% / 0.06)"
            strokeWidth="3"
          />
          <motion.circle
            cx="150"
            cy="150"
            r="120"
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${(progress / 100) * circumference} ${circumference}` }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          />
        </svg>

        {/* Inner subtle ring */}
        <motion.div
          className="absolute rounded-full border border-primary/10"
          style={{ width: "65%", height: "65%" }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center">
          <CountUp
            end={total}
            className={`font-mono text-4xl md:text-5xl font-bold ${color}`}
            duration={1500}
          />
          <span className="font-mono text-sm text-muted-foreground mt-1">kg CO₂</span>
        </div>
      </motion.div>

      <div className="flex gap-3 mt-6">
        <span className="px-3 py-1.5 rounded-full glass-card text-xs font-mono text-primary">
          vs last month: -18%
        </span>
        <span className="px-3 py-1.5 rounded-full glass-card text-xs font-mono text-primary">
          vs global avg: -34%
        </span>
      </div>
    </div>
  );
};

export default CarbonOrb;
