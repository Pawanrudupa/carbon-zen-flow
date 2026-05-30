import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const DAYS = ["Mon", "", "Wed", "", "Fri", "", ""];
const DAY_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = ["W1", "W2", "W3", "W4", "W5"];

interface HeatmapEntry {
  logged_at: string | null;
  co2_kg: number | null;
}

const MonthlyHeatmap = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<HeatmapEntry[]>([]);
  const [hoveredDay, setHoveredDay] = useState<{ week: number; day: number } | null>(null);

  // Fetch current month's entries
  const fetchMonthlyEntries = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, -1).toISOString();

      const { data, error } = await supabase
        .from("entries")
        .select("logged_at, co2_kg")
        .eq("user_id", user.id)
        .gte("logged_at", startOfMonth)
        .lte("logged_at", endOfMonth);

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error("Error loading monthly heatmap data:", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyEntries();

    // Listen to real-time events to reload (e.g., cleared entries, logs added)
    const handleRefresh = () => {
      fetchMonthlyEntries();
    };

    window.addEventListener("entriesCleared", handleRefresh);
    window.addEventListener("entryAdded", handleRefresh);

    return () => {
      window.removeEventListener("entriesCleared", handleRefresh);
      window.removeEventListener("entryAdded", handleRefresh);
    };
  }, [user]);

  // Calendar info
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const totalDays = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  // Aggregate emissions per day
  const dailyEmissions = useMemo(() => {
    const emissions: Record<number, number> = {};
    for (let i = 1; i <= 35; i++) {
      emissions[i] = 0;
    }

    entries.forEach((entry) => {
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
  }, [entries, year, month, totalDays]);

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
    if (intensity === 0) return "hsl(142 71% 45% / 0.10)";
    if (intensity === 1) return "hsl(142 71% 45% / 0.35)";
    if (intensity === 2) return "hsl(142 71% 45% / 0.60)";
    if (intensity === 3) return "hsl(142 71% 45% / 0.80)";
    return "hsl(142 71% 45% / 0.98)";
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
  if (loading) {
    return (
      <div className="glass-card rounded-xl p-5 animate-pulse">
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
    <div className="glass-card rounded-xl p-5">
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
        Monthly Heatmap
      </h3>

      <div className="inline-flex flex-col">
        {/* Week labels top */}
        <div className="flex ml-[28px] mb-[3px]">
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
          <div key={row} className="flex items-center" style={{ height: 13, marginBottom: 3 }}>
            <span className="text-[9px] font-mono text-muted-foreground/40 w-[25px] text-right mr-[3px]">
              {DAYS[row]}
            </span>
            <div className="flex" style={{ gap: 3 }}>
              {gridData.map((week, wi) => {
                const cell = week[row];
                return (
                  <motion.div
                    key={wi}
                    className={`relative rounded-[2px] ${cell.isValid ? "cursor-pointer" : "cursor-default"}`}
                    style={{ width: 13, height: 13, backgroundColor: getColor(cell) }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (row * weeks + wi) * 0.015, duration: 0.3 }}
                    whileHover={cell.isValid ? { scale: 1.4, transition: { duration: 0.12 } } : {}}
                    onMouseEnter={() => cell.isValid && setHoveredDay({ week: wi, day: row })}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {hoveredDay?.week === wi && hoveredDay?.day === row && cell.isValid && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-surface-elevated border border-primary/15 text-[9px] font-mono text-foreground whitespace-nowrap z-10 shadow-lg">
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

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[9px] text-muted-foreground/40 font-mono">Low</span>
        {["0.10", "0.35", "0.60", "0.80", "0.98"].map((a, i) => (
          <div
            key={i}
            className="rounded-[2px]"
            style={{ width: 10, height: 10, backgroundColor: `hsl(142 71% 45% / ${a})` }}
          />
        ))}
        <span className="text-[9px] text-muted-foreground/40 font-mono">High</span>
      </div>
    </div>
  );
};

export default MonthlyHeatmap;
