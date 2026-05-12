import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorCard from "@/components/ui/ErrorCard";

interface LeaderboardProps {
  householdId: string;
}

const COLORS = [
  "hsl(142, 71%, 45%)",
  "hsl(217, 91%, 60%)",
  "hsl(255, 82%, 76%)",
  "hsl(45, 93%, 47%)",
  "hsl(0, 84%, 60%)",
];

const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_TINTS = [
  "rgba(255,215,0,0.06)",
  "rgba(192,192,192,0.06)",
  "rgba(205,127,50,0.06)",
];

const Leaderboard = ({ householdId }: LeaderboardProps) => {
  const { user } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["household-leaderboard", householdId],
    queryFn: async () => {
      const { data: members, error: memErr } = await supabase
        .from("household_members" as any)
        .select("user_id, profiles(username)")
        .eq("household_id", householdId);
      if (memErr) throw memErr;

      const userIds = (members as any[]).map((m: any) => m.user_id);

      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const { data: entries, error: entErr } = await supabase
        .from("entries")
        .select("user_id, co2_kg, category")
        .in("user_id", userIds)
        .gte("logged_at", start.toISOString());
      if (entErr) throw entErr;

      return { members: members as any[], entries: entries || [] };
    },
    enabled: !!householdId,
  });

  const rankings = useMemo(() => {
    if (!data) return [];

    const stats: Record<string, { name: string; color: string; kg: number; catMap: Record<string, number>; isYou: boolean }> = {};

    (data.members as any[]).forEach((m: any, i: number) => {
      let uname = "Household Member";
      if (m.profiles) {
        uname = Array.isArray(m.profiles) ? (m.profiles[0]?.username || uname) : (m.profiles.username || uname);
      }
      
      stats[m.user_id] = {
        name: uname,
        color: COLORS[i % COLORS.length],
        kg: 0,
        catMap: {},
        isYou: m.user_id === user?.id,
      };
    });

    (data.entries as any[]).forEach((e: any) => {
      const s = stats[e.user_id];
      if (s) {
        s.kg += e.co2_kg || 0;
        const cat = (e.category || "other").toLowerCase();
        s.catMap[cat] = (s.catMap[cat] || 0) + (e.co2_kg || 0);
      }
    });

    return Object.values(stats)
      .sort((a, b) => a.kg - b.kg) // ascending: lowest CO₂ wins
      .map((s, i) => ({
        ...s,
        rank: i + 1,
        kg: Math.round(s.kg),
        medal: MEDALS[i] || "",
        tint: MEDAL_TINTS[i] || "transparent",
        initials: s.name.substring(0, 2).toUpperCase(),
        bestCat:
          Object.entries(s.catMap).sort((a, b) => a[1] - b[1])[0]?.[0] || null,
      }));
  }, [data, user?.id]);

  const maxKg = rankings.length > 0 ? Math.max(...rankings.map((r) => r.kg), 1) : 1;
  const householdTotal = rankings.reduce((s, r) => s + r.kg, 0);
  const month = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  if (isLoading) return <SkeletonCard className="h-48" />;
  if (isError) return <ErrorCard onRetry={() => refetch()} />;

  const leader = rankings[0];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Leaderboard
        </h3>
        <span className="text-xs text-muted-foreground font-mono">{month}</span>
      </div>

      <div
        className="rounded-xl border bg-card overflow-hidden"
        style={{ borderColor: "rgba(34,197,94,0.12)" }}
      >
        {rankings.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No entries logged this month yet
          </div>
        ) : (
          rankings.map((r, i) => (
            <div
              key={r.name}
              className={`flex items-center gap-3 px-5 py-4 border-b last:border-b-0 transition-colors ${
                r.isYou ? "ring-1 ring-inset ring-primary/20" : ""
              }`}
              style={{
                borderColor: "rgba(34,197,94,0.06)",
                backgroundColor: r.isYou ? "rgba(34,197,94,0.05)" : r.tint,
              }}
            >
              {/* Rank */}
              <span className="font-mono text-base font-bold text-muted-foreground/40 w-7 text-center flex-shrink-0">
                {r.medal || String(r.rank).padStart(2, "0")}
              </span>

              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ backgroundColor: `${r.color}22`, color: r.color }}
              >
                {r.initials}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <span className="text-sm text-foreground font-medium truncate">
                  {r.name}
                  {r.isYou && (
                    <span className="ml-2 text-[10px] text-primary font-mono">(You)</span>
                  )}
                </span>
              </div>

              {/* Kg */}
              <span className="font-mono text-sm text-foreground w-16 text-right flex-shrink-0">
                {r.kg} kg
              </span>

              {/* Pct of household total */}
              <span className="font-mono text-[10px] text-muted-foreground w-10 text-right flex-shrink-0 hidden sm:block">
                {householdTotal > 0 ? Math.round((r.kg / householdTotal) * 100) : 0}%
              </span>

              {/* Bar */}
              <div className="w-24 h-2 rounded-full bg-muted/30 overflow-hidden flex-shrink-0 hidden sm:block">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: r.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${maxKg > 0 ? (r.kg / maxKg) * 100 : 0}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tip */}
      {leader && leader.kg > 0 && (
        <p className="text-xs text-muted-foreground/70 italic mt-3 text-center">
          💡 {leader.name} is this month's household champion
          {leader.bestCat ? ` — lowest in ${leader.bestCat}` : ""}.
        </p>
      )}
    </div>
  );
};

export default Leaderboard;
