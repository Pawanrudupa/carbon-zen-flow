import { UtensilsCrossed, Car, Zap, ShoppingBag } from "lucide-react";

const categories = [
  {
    name: "Food",
    icon: UtensilsCrossed,
    value: 124,
    delta: -8,
    data: [18, 20, 15, 22, 16, 19, 14, 12],
    color: "#22C55E",
  },
  {
    name: "Transport",
    icon: Car,
    value: 89,
    delta: -22,
    data: [25, 18, 22, 12, 15, 10, 8, 11],
    color: "#3B82F6",
  },
  {
    name: "Energy",
    icon: Zap,
    value: 67,
    delta: 3,
    data: [8, 9, 8, 10, 9, 8, 9, 8],
    color: "#F59E0B",
  },
  {
    name: "Shopping",
    icon: ShoppingBag,
    value: 32,
    delta: -5,
    data: [5, 2, 8, 3, 4, 6, 2, 4],
    color: "#A78BFA",
  },
];

const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 32;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const TrendSparklines = () => (
  <div className="glass-card rounded-xl p-5 h-full flex flex-col justify-center gap-4">
    <h3 className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest">Trends (8 weeks)</h3>
    {categories.map((c) => (
      <div key={c.name} className="flex items-center gap-3">
        <c.icon size={16} style={{ color: c.color }} className="flex-shrink-0" />
        <span className="text-sm text-foreground/80 w-20 flex-shrink-0">{c.name}</span>
        <Sparkline data={c.data} color={c.color} />
        <span className="font-mono text-sm text-foreground w-14 text-right flex-shrink-0">{c.value} kg</span>
        <span
          className={`font-mono text-xs flex-shrink-0 ${
            c.delta <= 0 ? "text-primary" : "text-destructive"
          }`}
        >
          {c.delta <= 0 ? "▼" : "▲"} {Math.abs(c.delta)}%
        </span>
      </div>
    ))}
  </div>
);

export default TrendSparklines;
