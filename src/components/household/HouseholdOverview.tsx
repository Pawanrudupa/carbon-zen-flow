import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorCard from "@/components/ui/ErrorCard";
import { Target, TrendingDown, TrendingUp } from "lucide-react";

interface HouseholdOverviewProps {
  householdId: string;
}

const memberColors = [
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
          {p.dataKey}: {Math.round(p.value)} kg
        </p>
      ))}
    </div>
  );
};

const HouseholdOverview = ({ householdId }: HouseholdOverviewProps) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["household-overview", householdId],
    queryFn: async () => {
      // Fetch household details (includes goal)
      const { data: household, error: hhErr } = await supabase
        .from("households" as any)
        .select("name, goal_monthly_kg")
        .eq("id", householdId)
        .single();
      if (hhErr) throw hhErr;

      // Fetch members with usernames
      const { data: members, error: memErr } = await supabase
        .from("household_members" as any)
        .select("user_id, profiles(username)")
        .eq("household_id", householdId);
      if (memErr) throw memErr;

      const userIds = (members as any[]).map((m: any) => m.user_id);

      // Fetch last 4 months of entries for all members
      const start = new Date();
      start.setMonth(start.getMonth() - 4);
      start.setDate(1);
      const { data: entries, error: entErr } = await supabase
        .from("entries")
        .select("user_id, co2_kg, logged_at")
        .in("user_id", userIds)
        .gte("logged_at", start.toISOString());
      if (entErr) throw entErr;

      // Last month entries for delta
      const lastMonthStart = new Date();
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      lastMonthStart.setDate(1);
      const lastMonthEnd = new Date();
      lastMonthEnd.setDate(1);

      return {
        household: household as any,
        members: members as any[],
        entries: entries || [],
        lastMonthStart: lastMonthStart.toISOString(),
        lastMonthEnd: lastMonthEnd.toISOString(),
      };
    },
    enabled: !!householdId,
  });

  const processed = useMemo(() => {
    if (!data) return { currentTotal: 0, lastMonthTotal: 0, goal: 800, chartData: [], colorMap: {} };

    const goal = (data.household?.goal_monthly_kg as number) || 800;
    const now = new Date();

    const colorMap: Record<string, string> = {};
    const nameMap: Record<string, string> = {};
    (data.members as any[]).forEach((m: any, i: number) => {
      let uname = "Household Member";
      if (m.profiles) {
        uname = Array.isArray(m.profiles) ? (m.profiles[0]?.username || uname) : (m.profiles.username || uname);
      }
      nameMap[m.user_id] = uname;
      colorMap[uname] = memberColors[i % memberColors.length];
    });

    let currentTotal = 0;
    let lastMonthTotal = 0;
    const monthGroups: Record<string, any> = {};

    (data.entries as any[]).forEach((e: any) => {
      const d = new Date(e.logged_at);
      const isCurrentMonth = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      const isLastMonth =
        d >= new Date(data.lastMonthStart) && d < new Date(data.lastMonthEnd);

      if (isCurrentMonth) currentTotal += e.co2_kg || 0;
      if (isLastMonth) lastMonthTotal += e.co2_kg || 0;

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthGroups[key]) {
        monthGroups[key] = {
          month: d.toLocaleString("en-US", { month: "short" }),
          sortKey: key,
        };
        (data.members as any[]).forEach((m: any) => {
          monthGroups[key][nameMap[m.user_id] || "Household Member"] = 0;
        });
      }

      const uname = nameMap[e.user_id];
      if (uname && monthGroups[key]) {
        monthGroups[key][uname] = (monthGroups[key][uname] || 0) + (e.co2_kg || 0);
      }
    });

    const chartData = Object.values(monthGroups)
      .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey))
      .slice(-4);

    return { currentTotal, lastMonthTotal, goal, chartData, colorMap };
  }, [data]);

  if (isLoading) return <SkeletonCard className="h-64" />;
  if (isError) return <ErrorCard onRetry={() => refetch()} />;

  const { currentTotal, lastMonthTotal, goal, chartData, colorMap } = processed;

  const pct = goal > 0 ? Math.min(100, Math.round((currentTotal / goal) * 100)) : 0;
  const remaining = goal - currentTotal;
  const onTrack = currentTotal <= goal;
  const delta =
    lastMonthTotal > 0
      ? Math.round(((currentTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Combined footprint */}
        <div
          className="rounded-xl border bg-card p-5"
          style={{ borderColor: "rgba(34,197,94,0.12)" }}
        >
          <p className="text-xs text-muted-foreground mb-1">Combined footprint</p>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-foreground">
              {Math.round(currentTotal)}
            </span>
            <span className="text-sm text-muted-foreground">kg CO₂</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
          {delta !== 0 && (
            <div
              className={`flex items-center gap-1 text-xs font-mono mt-2 ${
                delta < 0 ? "text-primary" : "text-destructive"
              }`}
            >
              {delta < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              {delta < 0 ? "" : "+"}
              {delta}% vs last month
            </div>
          )}
        </div>

        {/* Goal progress */}
        <div
          className="rounded-xl border bg-card p-5"
          style={{ borderColor: "rgba(34,197,94,0.12)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Target size={12} className="text-primary" />
              Monthly goal progress
            </p>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                onTrack
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {onTrack ? "On track" : "Over target"}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-mono text-2xl font-bold text-foreground">
              {Math.round(currentTotal)}
            </span>
            <span className="text-sm text-muted-foreground">/ {Math.round(goal)} kg</span>
            <span className="font-mono text-sm text-muted-foreground ml-auto">{pct}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                backgroundColor: onTrack ? "hsl(142,71%,45%)" : "hsl(0,84%,60%)",
              }}
            />
          </div>

          <p className="text-xs font-mono mt-2" style={{ color: onTrack ? "hsl(142,69%,58%)" : "hsl(0,84%,60%)" }}>
            {remaining >= 0
              ? `${Math.round(remaining)} kg remaining`
              : `${Math.round(Math.abs(remaining))} kg over goal`}
          </p>
        </div>
      </div>

      {/* Stacked bar chart */}
      <div
        className="rounded-xl border bg-card p-5"
        style={{ borderColor: "rgba(34,197,94,0.12)" }}
      >
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">
          Household monthly trend
        </h3>
        {chartData.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground">
            No data yet — start logging entries to see trends
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barGap={4} barCategoryGap="25%">
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
                width={38}
              />
              <Tooltip content={<CustomTooltip />} />
              {Object.entries(colorMap).map(([uname, color]) => (
                <Bar key={uname} dataKey={uname} stackId="a" fill={color} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-3">
          {Object.entries(colorMap).map(([uname, color]) => (
            <div key={uname} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-muted-foreground">{uname}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HouseholdOverview;
