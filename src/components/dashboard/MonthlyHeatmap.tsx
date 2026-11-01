import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useDashboardData } from "@/hooks/useDashboardData";

const DAYS = ["Mon", "", "Wed", "", "Fri", "", ""];
const DAY_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = ["W1", "W2", "W3", "W4", "W5"];

const MonthlyHeatmap = () => {
  const { data: allEntries = [], isLoading } = useDashboardData();
  const [hoveredDay, setHoveredDay] = useState<{ week: number; day: number } | null>(null);

  // Calendar info
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const totalDays = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  // Aggregate current month's emissions per day directly from cached dashboard data
  const dailyEmissions = useMemo(() => {
    const emissions: Record<number, number> = {};
    for (let i = 1; i <= 35; i++) {
      emissions[i] = 0;
    }

    allEntries.forEach((entry) => {
      if (!entry.logged_at) return;
      const dateObj = new Date(entry.logged_at);
      if (dateObj.getFullYear() === year && dateObj.getMonth() === month) {
        const day = dateObj.getDate();
        if (day >= 1 && day <= totalDays) {
          emissions[day] = (emissions[day] || 0) + (entry.co2_kg || 0);
        }
      }
    });

    return emissions;
  }, [allEntries, year, month, totalDays]);

  // Determine dynamic range
  const nonZeroValues = useMemo(() => {
    return Object.keys(dailyEmissions)
      .map(Number)
      .filter((day) => day <= totalDays)
      .map((day) => dailyEmissions[day])
      .filter((val) => val > 0);
  }, [dailyEmissions, totalDays]);

  const maxCo2 = useMemo(() => (nonZeroValues.length > 0 ? Math.max(...nonZeroValues) : 0), [nonZeroValues]);
  const minCo2 = useMemo(() => (nonZeroValues.length > 0 ? Math.min(...nonZeroValues) : 0), [nonZeroValues]);

  // Calculate intensity scale 0 - 4
  const getIntensity = (co2: number) => {
    if (co2 === 0) return 0;
    if (maxCo2 === minCo2) return 2; // Flat emissions fallback
    const scaled = 1 + Math.floor(((co2 - minCo2) / (maxCo2 - minCo2)) * 3);
    return Math.min(scaled, 4);
  };

  const getColor = (cell: { date: number; isValid: boolean; co2: number }) => {
    if (!cell.isValid) return "rgba(255, 255, 255, 0.02)"; // Grey out-of-bound squares
    
    const intensity = getIntensity(cell.co2);
    if (intensity === 0) return "hsl(var(--primary) / 0.10)";
    if (intensity === 1) return "hsl(var(--primary) / 0.35)";
    if (intensity === 2) return "hsl(var(--primary) / 0.60)";
    if (intensity === 3) return "hsl(var(--primary) / 0.80)";
    return "hsl(var(--primary) / 0.98)";
  };

  // Build grid calendar items (5 weeks x 7 days)
  const gridData = useMemo(() => {
    const weeks = 5;
    return Array.from({ length: weeks }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const dateNum = w * 7 + d + 1;
        const isValidDate = dateNum <= totalDays;
        return {
          date: dateNum,
          isValid: isValidDate,
          co2: isValidDate ? Math.round(dailyEmissions[dateNum] * 10) / 10 : 0,
        };
      })
    );
  }, [dailyEmissions, totalDays]);

  // Render skeletal loader matching grid styling
  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-5 animate-pulse" aria-busy="true">
        <div className="h-3 w-24 bg-muted/40 rounded mb-4" />
        <div className="inline-flex flex-col">
          <div className="flex ml-[28px] mb-[3px] gap-[3px]">
            {MONTH_LABELS.map((label) => (
              <span
                key={label}
                className="text-[8px] font-mono text-muted-foreground/10 text-center w-[13px] mr-[3px]"
              >
                {label}
              </span>
            ))}
          </div>
          {Array.from({ length: 7 }).map((_, row) => (
            <div key={row} className="flex items-center" style={{ height: 13, marginBottom: 3 }}>
              <span className="text-[9px] font-mono text-muted-foreground/10 w-[25px] text-right mr-[3px]">
                {DAYS[row]}
              </span>
              <div className="flex" style={{ gap: 3 }}>
                {Array.from({ length: 5 }).map((_, col) => (
                  <div
                    key={col}
                    className="rounded-[2px] bg-muted/20"
                    style={{ width: 13, height: 13 }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const weeks = 5;

  return (
    <div className="glass-card rounded-xl p-5 min-w-0 overflow-hidden">
      <h3 className="font-mono text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-4">
        Monthly Heatmap
      </h3>

      <div className="overflow-x-auto max-w-full pb-1">
        <div
          role="grid"
          aria-label="Monthly carbon emissions calendar heatmap"
          className="inline-flex flex-col min-w-max"
        >
          {/* Week labels top */}
          <div className="flex ml-[28px] mb-[3px]" aria-hidden="true">
            {MONTH_LABELS.map((label) => (
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
            <div
              key={row}
              role="row"
              className="flex items-center"
              style={{ height: 13, marginBottom: 3 }}
            >
              <span
                className="text-[9px] font-mono text-muted-foreground/40 w-[25px] text-right mr-[3px]"
                aria-hidden="true"
              >
                {DAYS[row]}
              </span>
              <div className="flex" style={{ gap: 3 }}>
                {gridData.map((week, wi) => {
                  const cell = week[row];
                  const label = cell.isValid
                    ? `${DAY_FULL[row]}, Day ${cell.date}: ${cell.co2.toFixed(1)} kg CO2`
                    : "No calendar day";

                  return (
                    <motion.div
                      key={wi}
                      role="gridcell"
                      tabIndex={cell.isValid ? 0 : -1}
                      aria-label={label}
                      className={`relative rounded-[2px] ${
                        cell.isValid
                          ? "cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                          : "cursor-default"
                      }`}
                      style={{ width: 13, height: 13, backgroundColor: getColor(cell) }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (row * weeks + wi) * 0.015, duration: 0.3 }}
                      whileHover={cell.isValid ? { scale: 1.4, transition: { duration: 0.12 } } : {}}
                      onMouseEnter={() => cell.isValid && setHoveredDay({ week: wi, day: row })}
                      onMouseLeave={() => setHoveredDay(null)}
                      onFocus={() => cell.isValid && setHoveredDay({ week: wi, day: row })}
                      onBlur={() => setHoveredDay(null)}
                    >
                      {hoveredDay?.week === wi && hoveredDay?.day === row && cell.isValid && (
                        <div
                          role="tooltip"
                          className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-surface-elevated border border-primary/15 text-[9px] font-mono text-foreground whitespace-nowrap z-10 shadow-lg pointer-events-none"
                        >
                          {DAY_FULL[row]} · Day {cell.date} · {cell.co2.toFixed(1)} kg
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
      <div className="flex items-center gap-1.5 mt-3 justify-end" aria-hidden="true">
        <span className="text-[9px] text-muted-foreground/40 font-mono">Low</span>
        {["0.10", "0.35", "0.60", "0.80", "0.98"].map((a, i) => (
          <div
            key={i}
            className="rounded-[2px]"
            style={{ width: 10, height: 10, backgroundColor: `hsl(var(--primary) / ${a})` }}
          />
        ))}
        <span className="text-[9px] text-muted-foreground/40 font-mono">High</span>
      </div>
    </div>
  );
};

export default MonthlyHeatmap;
