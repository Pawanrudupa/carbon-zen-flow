import { useState } from "react";

const MonthlyHeatmap = () => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // Generate mock data for current month (30 days)
  const days = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    co2: Math.round(Math.random() * 15 + 3), // 3-18 kg/day
  }));

  const maxCo2 = Math.max(...days.map((d) => d.co2));
  const minCo2 = Math.min(...days.map((d) => d.co2));

  const getColor = (co2: number) => {
    // Lower = brighter green (good), higher = darker
    const normalized = 1 - (co2 - minCo2) / (maxCo2 - minCo2 || 1);
    const alpha = 0.15 + normalized * 0.85;
    return `rgba(34, 197, 94, ${alpha})`;
  };

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest mb-4">
        Monthly Heatmap — Lower is Greener
      </h3>
      <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-[repeat(15,1fr)] gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(15, days.length)}, 1fr)` }}>
        {days.map((d, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-sm cursor-pointer transition-transform hover:scale-110"
            style={{
              backgroundColor: getColor(d.co2),
              animation: `heatmap-fade 0.3s ease-out ${i * 0.02}s both`,
            }}
            onMouseEnter={() => setHoveredDay(i)}
            onMouseLeave={() => setHoveredDay(null)}
          >
            {hoveredDay === i && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-surface-elevated border border-primary/20 text-[10px] font-mono text-foreground whitespace-nowrap z-10">
                Day {d.day}: {d.co2} kg CO₂
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[10px] text-muted-foreground font-mono">More</span>
        {[0.15, 0.35, 0.55, 0.75, 0.95].map((a, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(34,197,94,${a})` }} />
        ))}
        <span className="text-[10px] text-muted-foreground font-mono">Less CO₂</span>
      </div>
    </div>
  );
};

export default MonthlyHeatmap;
