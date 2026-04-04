import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

const stats = [
  { label: "Combined footprint", value: "847", unit: "kg this month" },
  { label: "Members", value: "3", unit: "active" },
  { label: "Shared target", value: "900", unit: "kg/month", editable: true },
  { label: "On track", value: "Yes", unit: "5.9% under target", positive: true },
];

const chartData = [
  { month: "Jan", Alex: 312, Priya: 290, Sam: 245 },
  { month: "Feb", Alex: 285, Priya: 310, Sam: 210 },
  { month: "Mar", Alex: 380, Priya: 265, Sam: 280 },
  { month: "Apr", Alex: 312, Priya: 290, Sam: 245 },
];

const memberColors = {
  Alex: "hsl(142, 71%, 45%)",
  Priya: "hsl(217, 91%, 60%)",
  Sam: "hsl(255, 82%, 76%)",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-primary/10 bg-card px-4 py-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-mono text-xs" style={{ color: p.color }}>
          {p.dataKey}: {p.value} kg
        </p>
      ))}
    </div>
  );
};

const HouseholdOverview = () => {
  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border bg-card p-4"
            style={{ borderColor: "rgba(34,197,94,0.12)" }}
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono text-xl font-bold text-foreground">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.unit}</span>
            </div>
            {s.editable && (
              <button className="text-[10px] text-primary/60 hover:text-primary mt-1 transition-colors">
                Edit
              </button>
            )}
            {s.positive && (
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                ✓ On track
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Household monthly trend */}
      <div
        className="mt-6 rounded-xl border bg-card p-5"
        style={{ borderColor: "rgba(34,197,94,0.12)" }}
      >
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">
          Household monthly trend
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barGap={4} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.06)" />
            <XAxis
              dataKey="month"
              tick={{ fill: "hsl(142,69%,58%)", fontSize: 11, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(142,69%,58%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Alex" fill={memberColors.Alex} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Priya" fill={memberColors.Priya} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Sam" fill={memberColors.Sam} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-5 mt-3">
          {Object.entries(memberColors).map(([name, color]) => (
            <div key={name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-muted-foreground">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HouseholdOverview;
