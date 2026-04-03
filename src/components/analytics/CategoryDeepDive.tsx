import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const stackedData = [
  { month: "Nov", Food: 150, Transport: 110, Energy: 80, Shopping: 40 },
  { month: "Dec", Food: 170, Transport: 120, Energy: 85, Shopping: 35 },
  { month: "Jan", Food: 130, Transport: 100, Energy: 82, Shopping: 40 },
  { month: "Feb", Food: 100, Transport: 75, Energy: 63, Shopping: 30 },
  { month: "Mar", Food: 155, Transport: 105, Energy: 80, Shopping: 40 },
  { month: "Apr", Food: 120, Transport: 90, Energy: 70, Shopping: 32 },
];

const cats = [
  { key: "Food", color: "#22C55E", pct: 38 },
  { key: "Transport", color: "#3B82F6", pct: 29 },
  { key: "Energy", color: "#F59E0B", pct: 22 },
  { key: "Shopping", color: "#A78BFA", pct: 10 },
];

const ringRadius = [72, 58, 44, 30];

const CategoryDeepDive = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Stacked bar chart */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
          Breakdown over time
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stackedData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
              <span className="font-mono text-lg font-bold text-foreground">315 kg</span>
              <span className="font-mono text-[9px] text-muted-foreground">this month</span>
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
