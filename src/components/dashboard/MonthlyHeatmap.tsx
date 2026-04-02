import { useState } from "react";
import { motion } from "framer-motion";

const MonthlyHeatmap = () => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const days = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    co2: Math.round(Math.random() * 15 + 3),
  }));

  const maxCo2 = Math.max(...days.map((d) => d.co2));
  const minCo2 = Math.min(...days.map((d) => d.co2));

  const getColor = (co2: number) => {
    const normalized = 1 - (co2 - minCo2) / (maxCo2 - minCo2 || 1);
    const alpha = 0.12 + normalized * 0.88;
    return `rgba(34, 197, 94, ${alpha})`;
  };

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
        Monthly Heatmap
      </h3>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${Math.min(15, days.length)}, 1fr)` }}
      >
        {days.map((d, i) => (
          <motion.div
            key={i}
            className="relative aspect-square rounded cursor-pointer"
            style={{ backgroundColor: getColor(d.co2) }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: i * 0.02,
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ scale: 1.25, transition: { duration: 0.15 } }}
            onMouseEnter={() => setHoveredDay(i)}
            onMouseLeave={() => setHoveredDay(null)}
          >
            {hoveredDay === i && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-surface-elevated border border-primary/15 text-[9px] font-mono text-foreground whitespace-nowrap z-10 shadow-lg">
                Day {d.day} · {d.co2} kg
              </div>
            )}
          </motion.div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[9px] text-muted-foreground/40 font-mono">More</span>
        {[0.12, 0.3, 0.5, 0.7, 0.9].map((a, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: `rgba(34,197,94,${a})` }} />
        ))}
        <span className="text-[9px] text-muted-foreground/40 font-mono">Less</span>
      </div>
    </div>
  );
};

export default MonthlyHeatmap;
