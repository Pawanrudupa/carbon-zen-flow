import { motion } from "framer-motion";
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
  const w = 100;
  const h = 28;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="flex-shrink-0 opacity-80">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={`url(#grad-${color.replace("#", "")})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const rowVariant = {
  hidden: { opacity: 0, x: -16 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const TrendSparklines = () => (
  <div className="glass-card rounded-xl p-5 h-full flex flex-col justify-center">
    <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
      8-Week Trends
    </h3>
    <div className="flex flex-col gap-3.5">
      {categories.map((c, i) => (
        <motion.div
          key={c.name}
          className="flex items-center gap-3 group"
          variants={rowVariant}
          initial="hidden"
          animate="show"
          custom={i}
          whileHover={{ x: 4, transition: { duration: 0.2 } }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-shadow duration-300 group-hover:shadow-[0_0_12px_rgba(34,197,94,0.2)]"
            style={{ backgroundColor: `${c.color}15` }}
          >
            <c.icon size={13} style={{ color: c.color }} />
          </div>
          <span className="text-xs text-foreground/60 w-16 flex-shrink-0 font-medium">{c.name}</span>
          <Sparkline data={c.data} color={c.color} />
          <span className="font-mono text-xs text-foreground/80 w-12 text-right flex-shrink-0">
            {c.value}
          </span>
          <span
            className={`font-mono text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded-md ${
              c.delta <= 0
                ? "text-primary bg-primary/10"
                : "text-destructive bg-destructive/10"
            }`}
          >
            {c.delta <= 0 ? "↓" : "↑"}{Math.abs(c.delta)}%
          </span>
        </motion.div>
      ))}
    </div>
  </div>
);

export default TrendSparklines;
