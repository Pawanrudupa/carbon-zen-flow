import { useState, useMemo } from "react";
import { motion } from "framer-motion";

const DAYS = ["Mon", "", "Wed", "", "Fri", "", ""];
const DAY_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MonthlyHeatmap = () => {
  const [hoveredDay, setHoveredDay] = useState<{ week: number; day: number } | null>(null);

  const weeks = 5;
  const data = useMemo(
    () =>
      Array.from({ length: weeks }, (_, w) =>
        Array.from({ length: 7 }, (_, d) => ({
          date: w * 7 + d + 1,
          co2: Math.round(Math.random() * 15 + 3),
        }))
      ),
    []
  );

  const allCo2 = data.flat().map((d) => d.co2);
  const maxCo2 = Math.max(...allCo2);
  const minCo2 = Math.min(...allCo2);

  // Brighter green = lower emissions
  const getColor = (co2: number) => {
    const norm = 1 - (co2 - minCo2) / (maxCo2 - minCo2 || 1);
    if (norm > 0.75) return "hsl(142 71% 45% / 0.95)";
    if (norm > 0.5) return "hsl(142 71% 45% / 0.65)";
    if (norm > 0.25) return "hsl(142 71% 45% / 0.38)";
    return "hsl(142 71% 45% / 0.12)";
  };

  const monthLabels = ["W1", "W2", "W3", "W4", "W5"];

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
        Monthly Heatmap
      </h3>

      <div className="inline-flex flex-col">
        {/* Week labels top */}
        <div className="flex ml-[28px] mb-[3px]">
          {monthLabels.map((label) => (
            <span
              key={label}
              className="text-[8px] font-mono text-muted-foreground/30 text-center"
              style={{ width: 13, marginRight: 3 }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* 7 rows (Mon–Sun), day labels left */}
        {Array.from({ length: 7 }, (_, row) => (
          <div key={row} className="flex items-center" style={{ height: 13, marginBottom: 3 }}>
            <span
              className="text-[9px] font-mono text-muted-foreground/40 w-[25px] text-right mr-[3px]"
            >
              {DAYS[row]}
            </span>
            <div className="flex" style={{ gap: 3 }}>
              {data.map((week, wi) => {
                const cell = week[row];
                return (
                  <motion.div
                    key={wi}
                    className="relative rounded-[2px] cursor-pointer"
                    style={{ width: 13, height: 13, backgroundColor: getColor(cell.co2) }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (row * weeks + wi) * 0.015, duration: 0.3 }}
                    whileHover={{ scale: 1.4, transition: { duration: 0.12 } }}
                    onMouseEnter={() => setHoveredDay({ week: wi, day: row })}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {hoveredDay?.week === wi && hoveredDay?.day === row && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-surface-elevated border border-primary/15 text-[9px] font-mono text-foreground whitespace-nowrap z-10 shadow-lg">
                        {DAY_FULL[row]} · Day {cell.date} · {cell.co2} kg
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[9px] text-muted-foreground/40 font-mono">High</span>
        {["0.12", "0.38", "0.65", "0.95"].map((a, i) => (
          <div
            key={i}
            className="rounded-[2px]"
            style={{ width: 10, height: 10, backgroundColor: `hsl(142 71% 45% / ${a})` }}
          />
        ))}
        <span className="text-[9px] text-muted-foreground/40 font-mono">Low</span>
      </div>
    </div>
  );
};

export default MonthlyHeatmap;
