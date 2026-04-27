import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";

interface CategoryDeepDiveProps {
  entries: any[];
}

// base colors
const CAT_COLORS: Record<string, string> = {
  Food: "#22C55E",
  Transport: "#3B82F6",
  Energy: "#F59E0B",
  Shopping: "#A78BFA",
};

const ringRadius = [72, 58, 44, 30];

const CategoryDeepDive = ({ entries }: CategoryDeepDiveProps) => {
  const { stack, cats, totalAll } = useMemo(() => {
    const groups: Record<string, any> = {};
    const catTotals: Record<string, number> = { Food: 0, Transport: 0, Energy: 0, Shopping: 0 };
    let totalAll = 0;

    entries.forEach((e) => {
      const d = new Date(e.logged_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      
      if (!groups[key]) {
        groups[key] = { month: d.toLocaleString("en-US", { month: "short" }), sortKey: key, Food: 0, Transport: 0, Energy: 0, Shopping: 0 };
      }
      
      let cat = e.category || "other";
      cat = cat.charAt(0).toUpperCase() + cat.slice(1);
      if (catTotals[cat] === undefined) cat = "Shopping"; // Map unknown to something, or ignore. Just summing known ones.
      
      if (catTotals[cat] !== undefined) {
        const val = e.co2_kg || 0;
        groups[key][cat] += val;
        catTotals[cat] += val;
        totalAll += val;
      }
    });

    const stack = Object.values(groups).sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey));
    
    const cats = Object.entries(CAT_COLORS).map(([key, color]) => ({
      key,
      color,
      pct: totalAll > 0 ? Math.round((catTotals[key] / totalAll) * 100) : 0,
    }));

    return { stack, cats, totalAll };
  }, [entries]);

  if (stack.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Stacked bar chart */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
          Breakdown over time
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stack} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.08)" />
            <XAxis
              dataKey="month"
              tick={{ fill: "hsl(142 69% 58%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(142 69% 58%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#111A14",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: 8,
                fontSize: 11,
                fontFamily: "JetBrains Mono",
              }}
            />
            {cats.map((c) => (
              <Bar key={c.key} dataKey={c.key} stackId="a" fill={c.color} radius={[0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3">
          {cats.map((c) => (
            <div key={c.key} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
              {c.key}
            </div>
          ))}
        </div>
      </div>

      {/* Radial rings */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
          Category comparison
        </h3>
        <div className="flex items-center justify-center gap-8">
          <div className="relative" style={{ width: 170, height: 170 }}>
            <svg width="170" height="170" viewBox="0 0 170 170">
              {cats.map((c, i) => {
                const r = ringRadius[i];
                const circ = 2 * Math.PI * r;
                const dashLen = (c.pct / 100) * circ;
                return (
                  <g key={c.key}>
                    <circle
                      cx="85" cy="85" r={r}
                      fill="none" stroke={c.color} strokeWidth={8}
                      opacity={0.12}
                    />
                    <motion.circle
                      cx="85" cy="85" r={r}
                      fill="none" stroke={c.color} strokeWidth={8}
                      strokeLinecap="round"
                      strokeDasharray={`${dashLen} ${circ}`}
                      transform="rotate(-90 85 85)"
                      initial={{ strokeDasharray: `0 ${circ}` }}
                      animate={{ strokeDasharray: `${dashLen} ${circ}` }}
                      transition={{ duration: 1.2, delay: i * 0.15, ease: "easeOut" }}
                    />
                  </g>
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-lg font-bold text-foreground">{Math.round(totalAll)} kg</span>
              <span className="font-mono text-[9px] text-muted-foreground">total</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {cats.map((c) => (
              <div key={c.key} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                <span className="text-[11px] text-muted-foreground w-16">{c.key}</span>
                <span className="font-mono text-[11px] text-foreground">{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDeepDive;
