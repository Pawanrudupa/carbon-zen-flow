import { useState } from "react";

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
  const r = 80;
  const cx = 100;
  const cy = 100;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="glass-card rounded-xl p-5 h-full flex flex-col items-center justify-center">
      <h3 className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest mb-4 self-start">
        Category Breakdown
      </h3>
      <svg width="200" height="200" viewBox="0 0 200 200" className="mb-4">
        {segments.map((seg, i) => {
          const dashLen = (seg.pct / 100) * circumference;
          const gap = circumference - dashLen;
          const currentOffset = offset;
          offset += dashLen;
          const isHovered = hovered === i;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={isHovered ? 20 : 16}
              strokeDasharray={`${dashLen} ${gap}`}
              strokeDashoffset={-currentOffset}
              className="transition-all duration-300 origin-center"
              style={{
                transform: `rotate(-90deg)`,
                transformOrigin: `${cx}px ${cy}px`,
                opacity: hovered !== null && !isHovered ? 0.4 : 1,
                animation: `draw-in 1s ease-out ${i * 0.1}s both`,
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground font-mono text-xl font-bold">
          {hovered !== null ? segments[hovered].value : total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px]">
          {hovered !== null ? segments[hovered].label : "kg total"}
        </text>
      </svg>
      <div className="flex flex-wrap gap-3 justify-center">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 text-xs cursor-pointer"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-mono text-foreground/70">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryBreakdown;
