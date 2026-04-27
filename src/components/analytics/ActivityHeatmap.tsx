import { useState, useMemo } from "react";
import { motion } from "framer-motion";

interface ActivityHeatmapProps {
  entries: any[];
}

const DAY_LABELS = ["M", "", "W", "", "F", "", ""];
const DAY_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_PER_WEEK = 7;

const ActivityHeatmap = ({ entries }: ActivityHeatmapProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const weeks = 26;
  
  const data = useMemo(() => {
    const today = new Date();
    const dow = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0=Mon, 6=Sun
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - dow));
    
    const days = weeks * DAYS_PER_WEEK;
    const result = Array(days).fill(null).map((_, i) => {
      const d = new Date(endOfWeek);
      d.setDate(endOfWeek.getDate() - (days - 1 - i));
      return {
        date: d,
        dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        co2: 0,
      };
    });

    const dayMap = new Map(result.map((r, i) => [r.dateStr, i]));

    entries.forEach((e) => {
      const d = new Date(e.logged_at);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const idx = dayMap.get(ds);
      if (idx !== undefined) {
        result[idx].co2 += e.co2_kg || 0;
      }
    });

    return result;
  }, [entries]);

  const maxCo2 = Math.max(...data.map((d) => d.co2), 1);
  const minCo2 = Math.min(...data.map((d) => d.co2));
  const avg = data.reduce((s, d) => s + d.co2, 0) / (data.filter(d => d.co2 > 0).length || 1);

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
    const status = d.co2 === 0 ? "no data" : d.co2 < avg ? "below avg" : "above avg";
    const dateStr = d.date.toLocaleString("en-US", { month: "short", day: "numeric" });
    return `${dayOfWeek}, ${dateStr} · ${Math.round(d.co2)} kg CO₂ — ${status}`;
  };

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
        Daily activity
      </h3>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col">
          {/* Month labels top — computed from actual date range */}
          <div className="relative flex ml-[28px] mb-1 h-4">
            {(() => {
              const monthLabels: { label: string; col: number }[] = [];
              let lastMonth = -1;
              data.forEach((cell, idx) => {
                const col = Math.floor(idx / 7);
                const m = cell.date.getMonth();
                if (m !== lastMonth) {
                  lastMonth = m;
                  monthLabels.push({ label: cell.date.toLocaleString("en-US", { month: "short" }), col });
                }
              });
              return monthLabels.map(({ label, col }) => (
                <span
                  key={`${label}-${col}`}
                  className="text-[9px] font-mono text-muted-foreground/40 absolute"
                  style={{ left: `${28 + col * 16}px` }}
                >
                  {label}
                </span>
              ));
            })()}
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
