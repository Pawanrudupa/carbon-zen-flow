import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const segments = [
  { label: "Food", value: 124, color: "#22C55E", pct: 40 },
  { label: "Transport", value: 89, color: "#3B82F6", pct: 28 },
  { label: "Energy", value: 67, color: "#F59E0B", pct: 21 },
  { label: "Shopping", value: 32, color: "#A78BFA", pct: 10 },
  { label: "Other", value: 3, color: "#14B8A6", pct: 1 },
];

const CategoryBreakdown = () => {
  const [hovered, setHovered] = useState<number | null>(null);
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
        {/* Chart */}
        <div className="relative">
          <svg width="180" height="180" viewBox="0 0 180 180">
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
                  }}
                  animate={{
                    opacity: hovered !== null && !isHovered ? 0.3 : 1,
                    strokeWidth: isHovered ? 18 : 14,
                  }}
                  transition={{ duration: 0.3 }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-pointer"
                />
              );
            })}
            <text x={cx} y={cy - 4} textAnchor="middle" className="fill-foreground font-mono text-lg font-bold">
              {hovered !== null ? segments[hovered].value : total}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" className="fill-muted-foreground font-mono text-[9px]">
              {hovered !== null ? segments[hovered].label : "kg total"}
            </text>
          </svg>
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
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-muted-foreground/70 w-16">{seg.label}</span>
              <span className="font-mono text-foreground/60">{seg.value}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryBreakdown;
