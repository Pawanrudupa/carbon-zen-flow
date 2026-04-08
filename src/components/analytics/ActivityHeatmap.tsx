import { useState, useMemo } from "react";
import { motion } from "framer-motion";

const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
const DAY_LABELS = ["M", "", "W", "", "F", "", ""];
const DAY_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_PER_WEEK = 7;

const ActivityHeatmap = () => {
  const [hovered, setHovered] = useState<number | null>(null);

  const weeks = 26;
  const data = useMemo(
    () =>
      Array.from({ length: weeks * DAYS_PER_WEEK }, (_, i) => ({
        co2: Math.round(Math.random() * 14 + 4),
      })),
    []
  );

  const maxCo2 = Math.max(...data.map((d) => d.co2));
  const minCo2 = Math.min(...data.map((d) => d.co2));
  const avg = data.reduce((s, d) => s + d.co2, 0) / data.length;

  // Brighter green = lower emissions
  const getColor = (co2: number) => {
    const norm = 1 - (co2 - minCo2) / (maxCo2 - minCo2 || 1);
    if (norm > 0.8) return "hsl(142 71% 45% / 0.95)";
    if (norm > 0.6) return "hsl(142 71% 45% / 0.7)";
    if (norm > 0.4) return "hsl(142 71% 45% / 0.45)";
    if (norm > 0.2) return "hsl(142 71% 45% / 0.25)";
    return "hsl(142 71% 45% / 0.08)";
  };

  const getTooltip = (idx: number) => {
    const d = data[idx];
    const dayOfWeek = DAY_FULL[idx % 7];
    const weekIdx = Math.floor(idx / 7);
    const dayNum = (weekIdx % 30) + 1;
    const monthIdx = Math.min(Math.floor(weekIdx / 4.33), 5);
    const status = d.co2 < avg ? "below average" : "above average";
    return `${dayOfWeek} ${dayNum} ${MONTHS[monthIdx]} · ${d.co2} kg CO₂ — ${status}`;
  };

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
        Daily activity
      </h3>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col">
          {/* Month labels top */}
          <div className="flex ml-[28px] mb-1">
            {MONTHS.map((m) => (
              <span
                key={m}
                className="text-[9px] font-mono text-muted-foreground/40"
                style={{ width: `${(weeks / 6) * 16}px` }}
              >
                {m}
              </span>
            ))}
          </div>

          {/* 7 rows (Mon–Sun), day labels left (M W F only) */}
          {Array.from({ length: 7 }, (_, row) => (
            <div key={row} className="flex items-center" style={{ height: 13, marginBottom: 3 }}>
              <span className="text-[9px] font-mono text-muted-foreground/40 w-[25px] text-right mr-[3px]">
                {DAY_LABELS[row]}
              </span>
              <div className="flex" style={{ gap: 3 }}>
                {Array.from({ length: weeks }, (_, col) => {
                  const idx = col * 7 + row;
                  if (idx >= data.length) return <div key={col} style={{ width: 13, height: 13 }} />;
                  const d = data[idx];
                  return (
                    <motion.div
                      key={col}
                      className="rounded-[2px] cursor-pointer relative"
                      style={{ width: 13, height: 13, backgroundColor: getColor(d.co2) }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.003, duration: 0.2 }}
                      whileHover={{ scale: 1.5, transition: { duration: 0.1 } }}
                      onMouseEnter={() => setHovered(idx)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {hovered === idx && (
                        <div
                          className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[9px] font-mono text-foreground whitespace-nowrap z-20 shadow-lg"
                          style={{ background: "#111A14", border: "1px solid rgba(34,197,94,0.2)" }}
                        >
                          {getTooltip(idx)}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[9px] text-muted-foreground/40 font-mono">High</span>
        {["0.08", "0.25", "0.45", "0.7", "0.95"].map((a, i) => (
          <div key={i} className="rounded-[2px]" style={{ width: 10, height: 10, backgroundColor: `hsl(142 71% 45% / ${a})` }} />
        ))}
        <span className="text-[9px] text-muted-foreground/40 font-mono">Low</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
