import { useEffect, useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, Car, Zap, ShoppingBag } from "lucide-react";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorCard from "@/components/ui/ErrorCard";
import { useDashboardData } from "@/hooks/useDashboardData";

const HeartbeatSparkline = ({ data, color }: { data: number[]; color: string }) => {
  const w = 120;
  const h = 32;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pathRef = useRef<SVGPathElement>(null);
  const [length, setLength] = useState(0);

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 6) - 3,
  }));

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }

  useEffect(() => {
    if (pathRef.current) {
      setLength(pathRef.current.getTotalLength());
    }
  }, []);

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <defs>
        <linearGradient id={`hb-${color.replace("#", "")}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
        <filter id={`glow-${color.replace("#", "")}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={d} fill="none" stroke={color} strokeWidth="1" opacity="0.15" />
      <motion.path
        ref={pathRef}
        d={d}
        fill="none"
        stroke={`url(#hb-${color.replace("#", "")})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${color.replace("#", "")})`}
        initial={{ strokeDasharray: length || 300, strokeDashoffset: length || 300 }}
        animate={{ strokeDashoffset: [length || 300, 0, 0, length || 300] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", times: [0, 0.4, 0.7, 1] }}
      />
      <motion.circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="3"
        fill={color}
        animate={{ r: [2.5, 4, 2.5], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        filter={`url(#glow-${color.replace("#", "")})`}
      />
    </svg>
  );
};

const rowVariant = {
  hidden: { opacity: 0, x: -16 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const CATEGORY_META = [
  { name: "Food",      key: "food",      icon: UtensilsCrossed, color: "#22C55E" },
  { name: "Transport", key: "transport", icon: Car,              color: "#3B82F6" },
  { name: "Energy",    key: "energy",    icon: Zap,              color: "#F59E0B" },
  { name: "Shopping",  key: "shopping",  icon: ShoppingBag,      color: "#A78BFA" },
];

const TrendSparklines = () => {
  const { data: allEntries = [], isLoading, isError, refetch } = useDashboardData();

  const categories = useMemo(() => {
    const now = new Date();

    const grouped: Record<string, number[]> = {
      food:      Array(8).fill(0),
      transport: Array(8).fill(0),
      energy:    Array(8).fill(0),
      shopping:  Array(8).fill(0),
    };

    allEntries.forEach((e) => {
      const cat = e.category || "other";
      if (!grouped[cat]) return;
      const loggedDate = new Date(e.logged_at);
      const daysDiff = Math.floor((now.getTime() - loggedDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekIdx = Math.min(7, Math.max(0, 7 - Math.floor(daysDiff / 7)));
      grouped[cat][weekIdx] += (e.co2_kg || 0);
    });

    return CATEGORY_META.map((cat) => {
      const weeklyData = grouped[cat.key];
      const totalValue = weeklyData.reduce((sum, val) => sum + val, 0);
      const latest = weeklyData[7];
      const prev   = weeklyData[6];
      let delta = 0;
      if (prev > 0)         delta = Math.round(((latest - prev) / prev) * 100);
      else if (latest > 0)  delta = 100;

      return { ...cat, value: Math.round(totalValue), delta, data: weeklyData };
    }).filter(r => r.value > 0);
  }, [allEntries]);

  return (
    <div className="glass-card rounded-xl p-5 h-full flex flex-col justify-center">
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
        8-Week Trends
      </h3>
      {isLoading ? (
        <SkeletonCard className="h-full" />
      ) : isError ? (
        <ErrorCard onRetry={() => refetch()} />
      ) : categories.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground py-8">No data available</div>
      ) : (
        <div className="flex flex-col gap-4">
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
              <motion.div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${c.color}15` }}
                whileHover={{ boxShadow: `0 0 14px ${c.color}40`, scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <c.icon size={13} style={{ color: c.color }} />
              </motion.div>
              <span className="text-xs text-foreground/60 w-16 flex-shrink-0 font-medium">{c.name}</span>
              <HeartbeatSparkline data={c.data} color={c.color} />
              <span className="font-mono text-xs text-foreground/80 w-12 text-right flex-shrink-0">
                {c.value}
              </span>
              <span
                className={`font-mono text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded-md ${
                  c.delta < 0
                    ? "text-primary bg-primary/10"
                    : c.delta > 0
                    ? "text-destructive bg-destructive/10"
                    : "text-muted-foreground bg-muted/20"
                }`}
              >
                {c.delta < 0 ? "↓" : c.delta > 0 ? "↑" : "−"}{Math.abs(c.delta)}%
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendSparklines;
