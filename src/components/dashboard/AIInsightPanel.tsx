import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const insights = [
  {
    type: "PATTERN",
    text: "Weekend food emissions are 2.3× higher than weekdays. Try meal prepping Sundays.",
    color: "text-chart-amber",
    bg: "bg-chart-amber/10",
  },
  {
    type: "ACTION",
    text: "Switch 2 car trips to transit this week to save ~4.2 kg CO₂.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    type: "FORECAST",
    text: "On track to finish at 340 kg — 15% under target.",
    color: "text-info",
    bg: "bg-info/10",
  },
];

const cardVariant = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

const AIInsightPanel = () => (
  <div className="glass-card rounded-xl p-5 h-full flex flex-col">
    <div className="flex items-center gap-2 mb-4">
      <motion.div
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="text-primary" size={14} />
      </motion.div>
      <h3 className="font-heading font-600 text-foreground/80 text-xs">AI Insights</h3>
      <motion.div
        className="w-1.5 h-1.5 rounded-full bg-primary ml-auto"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
    <div className="flex-1 flex flex-col gap-2.5">
      {insights.map((ins, i) => (
        <motion.div
          key={i}
          className="glass-card rounded-lg p-3 flex-1 group hover:border-primary/20 transition-colors"
          variants={cardVariant}
          initial="hidden"
          animate="show"
          custom={i}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <span className={`font-mono text-[9px] uppercase tracking-[0.15em] ${ins.color} ${ins.bg} px-1.5 py-0.5 rounded`}>
            {ins.type}
          </span>
          <p className="text-foreground/60 text-[11px] mt-1.5 leading-relaxed">{ins.text}</p>
        </motion.div>
      ))}
    </div>
    <div className="mt-3">
      <input
        type="text"
        placeholder="Ask your data anything…"
        className="w-full px-3 py-2 rounded-lg bg-input border border-primary/10 text-foreground text-[11px] placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-colors"
      />
    </div>
  </div>
);

export default AIInsightPanel;
