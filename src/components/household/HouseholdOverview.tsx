import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorCard from "@/components/ui/ErrorCard";

interface HouseholdOverviewProps {
  householdId: string;
}

const colors = [
  "hsl(142, 71%, 45%)",
  "hsl(217, 91%, 60%)",
  "hsl(255, 82%, 76%)",
  "hsl(45, 93%, 47%)",
  "hsl(0, 84%, 60%)",
];

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

const HouseholdOverview = ({ householdId }: HouseholdOverviewProps) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["household-overview", householdId],
    queryFn: async () => {
      // Fetch members
      const { data: members, error: memErr } = await supabase
        .from("household_members")
        .select("user_id, profiles(username)")
        .eq("household_id", householdId);
      if (memErr) throw memErr;

      const userIds = members.map(m => m.user_id);
      
      // Fetch entries for all members for the last 4 months
      const start = new Date();
      start.setMonth(start.getMonth() - 4);
      const { data: entries, error: entErr } = await supabase
        .from("entries")
        .select("user_id, co2_kg, logged_at")
        .in("user_id", userIds)
        .gte("logged_at", start.toISOString());
      if (entErr) throw entErr;

      return { members, entries };
    },
    enabled: !!householdId,
  });

  const processed = useMemo(() => {
    if (!data) return { stats: [], chartData: [], memberColors: {} };

    const memberMap = new Map();
    const memberColors: Record<string, string> = {};
    data.members.forEach((m, i) => {
      const name = m.profiles?.username || "Unknown";
      memberMap.set(m.user_id, name);
      memberColors[name] = colors[i % colors.length];
    });

    let currentMonthTotal = 0;
    const now = new Date();
    const groups: Record<string, any> = {};

    data.entries.forEach(e => {
      const d = new Date(e.logged_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!groups[key]) {
        groups[key] = { month: d.toLocaleString("en-US", { month: "short" }), sortKey: key };
        data.members.forEach(m => {
          groups[key][m.profiles?.username || "Unknown"] = 0;
        });
      }
      
      const name = memberMap.get(e.user_id);
      if (name && groups[key]) {
        groups[key][name] = (groups[key][name] || 0) + (e.co2_kg || 0);
      }

      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        currentMonthTotal += e.co2_kg;
      }
    });

    const chartData = Object.values(groups)
      .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey))
      .slice(-4);

    const stats = [
      { label: "Combined footprint", value: Math.round(currentMonthTotal).toString(), unit: "kg this month" },
      { label: "Members", value: data.members.length.toString(), unit: "active" },
      { label: "Shared target", value: "1200", unit: "kg/month", editable: true },
      { label: "On track", value: currentMonthTotal <= 1200 ? "Yes" : "No", unit: "vs target", positive: currentMonthTotal <= 1200 },
    ];

    return { stats, chartData, memberColors };
  }, [data]);

  if (isLoading) return <SkeletonCard className="h-64" />;
  if (isError) return <ErrorCard onRetry={() => refetch()} />;

  const { stats, chartData, memberColors } = processed;

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
        {chartData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
            No data available
          </div>
        ) : (
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
              {Object.entries(memberColors).map(([name, color]) => (
                <Bar key={name} dataKey={name} fill={color} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
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
