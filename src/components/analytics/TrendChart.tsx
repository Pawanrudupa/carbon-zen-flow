import { useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

const allData = [
  { month: "Nov", total: 380, food: 150, transport: 110, energy: 80, shopping: 40 },
  { month: "Dec", total: 410, food: 170, transport: 120, energy: 85, shopping: 35 },
  { month: "Jan", total: 352, food: 130, transport: 100, energy: 82, shopping: 40 },
  { month: "Feb", total: 268, food: 100, transport: 75, energy: 63, shopping: 30 },
  { month: "Mar", total: 380, food: 155, transport: 105, energy: 80, shopping: 40 },
  { month: "Apr", total: 312, food: 120, transport: 90, energy: 70, shopping: 32 },
];

const categories = [
  { key: "All", color: "#22C55E" },
  { key: "Food", color: "#22C55E" },
  { key: "Transport", color: "#3B82F6" },
  { key: "Energy", color: "#F59E0B" },
  { key: "Shopping", color: "#A78BFA" },
];

const TARGET = 350;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const diff = ((val - TARGET) / TARGET * 100).toFixed(1);
  const sign = val > TARGET ? "+" : "";
  return (
    <div className="px-3 py-2 rounded-lg text-xs font-mono"
      style={{ background: "#111A14", border: "1px solid rgba(34,197,94,0.2)" }}>
      <span className="text-foreground">{label} · {val} kg · {sign}{diff}% vs target</span>
    </div>
  );
};

const TrendChart = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const dataKey = activeCategory === "All" ? "total" : activeCategory.toLowerCase();
  const lineColor = categories.find((c) => c.key === activeCategory)?.color || "#22C55E";

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
        Monthly emissions over time
      </h3>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={allData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.08)" />
          <XAxis
            dataKey="month"
            tick={{ fill: "hsl(142 69% 58%)", fontSize: 11, fontFamily: "JetBrains Mono" }}
            axisLine={{ stroke: "rgba(34,197,94,0.1)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "hsl(142 69% 58%)", fontSize: 11, fontFamily: "JetBrains Mono" }}
            axisLine={false}
            tickLine={false}
            domain={[0, 500]}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={TARGET}
            stroke="#F59E0B"
            strokeDasharray="6 4"
            label={{
              value: "Target: 350 kg",
              position: "right",
              fill: "#F59E0B",
              fontSize: 10,
              fontFamily: "JetBrains Mono",
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            fill="url(#areaFill)"
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={lineColor}
            strokeWidth={2.5}
            dot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: lineColor, stroke: "#0A0F0D", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-2 mt-4">
        <span className="text-[10px] font-mono text-muted-foreground/50 mr-1">Show:</span>
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveCategory(c.key)}
            className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all ${
              activeCategory === c.key
                ? "text-primary-foreground"
                : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
            }`}
            style={activeCategory === c.key ? { background: c.color } : {}}
          >
            {c.key}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrendChart;
