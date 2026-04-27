import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import ErrorCard from "@/components/ui/ErrorCard";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { useDashboardData } from "@/hooks/useDashboardData";

const CategoryBreakdown = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  const { data: allEntries = [], isLoading, isError, refetch } = useDashboardData();

  const segments = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEntries = allEntries.filter(e => new Date(e.logged_at) >= startOfMonth);

    const rawSums: Record<string, number> = { food: 0, transport: 0, energy: 0, shopping: 0, other: 0 };
    monthEntries.forEach(e => {
      const cat = e.category || "other";
      if (rawSums[cat] !== undefined) rawSums[cat] += (e.co2_kg || 0);
      else rawSums.other += (e.co2_kg || 0);
    });

    const totalSum = Object.values(rawSums).reduce((a, b) => a + b, 0);
    if (totalSum === 0) return [];

    const colorMap: Record<string, string> = {
      food: "#22C55E", transport: "#3B82F6", energy: "#F59E0B", shopping: "#A78BFA", other: "#14B8A6"
    };
    const labelMap: Record<string, string> = {
      food: "Food", transport: "Transport", energy: "Energy", shopping: "Shopping", other: "Other"
    };

    return Object.entries(rawSums)
      .filter(([_, val]) => val > 0)
      .map(([key, val]) => ({
        label: labelMap[key],
        value: Math.round(val),
        color: colorMap[key],
        pct: Math.round((val / totalSum) * 100),
      }))
      .sort((a, b) => b.value - a.value);
  }, [allEntries]);

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = 72;
  const cx = 90;
  const cy = 90;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="glass-card rounded-xl p-5 h-full flex flex-col">
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-3">
        Category Breakdown
      </h3>
      <div className="flex items-center justify-center flex-1 gap-6">
        {isLoading ? (
          <SkeletonCard className="w-full h-full" />
        ) : isError ? (
          <ErrorCard onRetry={() => refetch()} className="w-full" />
        ) : segments.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground w-full">No data this month</div>
        ) : (
          <>
            {/* Rotating ring chart */}
            <div className="relative">
              <motion.svg
                width="180"
                height="180"
                viewBox="0 0 180 180"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                style={{ originX: "50%", originY: "50%" }}
              >
                {segments.map((seg, i) => {
                  const dashLen = (seg.pct / 100) * circumference;
                  const gap = circumference - dashLen;
                  const currentOffset = offset;
                  offset += dashLen;
                  const isHovered = hovered === i;
                  return (
                    <motion.circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={isHovered ? 18 : 14}
                      strokeDasharray={`${dashLen} ${gap}`}
                      strokeDashoffset={-currentOffset}
                      style={{
                        transform: `rotate(-90deg)`,
                        transformOrigin: `${cx}px ${cy}px`,
                        filter: isHovered ? `drop-shadow(0 0 8px ${seg.color})` : "none",
                      }}
                      initial={{ strokeDashoffset: circumference - currentOffset }}
                      animate={{
                        opacity: hovered !== null && !isHovered ? 0.25 : 1,
                        strokeWidth: isHovered ? 18 : 14,
                        strokeDashoffset: -currentOffset,
                      }}
                      transition={{ duration: 0.3 }}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      className="cursor-pointer"
                    />
                  );
                })}
              </motion.svg>
              {/* Center text counter-rotates to stay readable */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="fill-foreground font-mono text-lg font-bold text-foreground">
                  {hovered !== null ? segments[hovered].value : total}
                </span>
                <span className="fill-muted-foreground font-mono text-[9px] text-muted-foreground">
                  {hovered !== null ? segments[hovered].label : "kg total"}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-2">
              {segments.map((seg, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 text-[11px] cursor-pointer"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  animate={{ opacity: hovered !== null && hovered !== i ? 0.4 : 1 }}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: seg.color }}
                    animate={{
                      scale: hovered === i ? [1, 1.4, 1] : 1,
                      boxShadow: hovered === i ? `0 0 8px ${seg.color}` : "none",
                    }}
                    transition={{ duration: 0.6, repeat: hovered === i ? Infinity : 0 }}
                  />
                  <span className="text-muted-foreground/70 w-16">{seg.label}</span>
                  <span className="font-mono text-foreground/60">{seg.value}</span>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryBreakdown;
