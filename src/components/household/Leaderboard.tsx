import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorCard from "@/components/ui/ErrorCard";

interface LeaderboardProps {
  householdId: string;
}

const colors = [
  "hsl(142, 71%, 45%)",
  "hsl(217, 91%, 60%)",
  "hsl(255, 82%, 76%)",
  "hsl(45, 93%, 47%)",
  "hsl(0, 84%, 60%)",
];

const Leaderboard = ({ householdId }: LeaderboardProps) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["household-leaderboard", householdId],
    queryFn: async () => {
      const { data: members, error: memErr } = await supabase
        .from("household_members")
        .select("user_id, profiles(username)")
        .eq("household_id", householdId);
      if (memErr) throw memErr;

      const userIds = members.map(m => m.user_id);
      
      const start = new Date();
      start.setDate(1); // this month
      
      const { data: entries, error: entErr } = await supabase
        .from("entries")
        .select("user_id, co2_kg")
        .in("user_id", userIds)
        .gte("logged_at", start.toISOString());
      if (entErr) throw entErr;

      return { members, entries };
    },
    enabled: !!householdId,
  });

  const rankings = useMemo(() => {
    if (!data) return [];
    
    const memberStats: Record<string, any> = {};
    data.members.forEach((m, i) => {
      const name = m.profiles?.username || "Unknown";
      memberStats[m.user_id] = {
        name,
        initials: name.substring(0, 2).toUpperCase(),
        color: colors[i % colors.length],
        kg: 0,
      };
    });

    data.entries.forEach(e => {
      if (memberStats[e.user_id]) {
        memberStats[e.user_id].kg += (e.co2_kg || 0);
      }
    });

    const sorted = Object.values(memberStats).sort((a: any, b: any) => a.kg - b.kg);
    
    return sorted.map((s: any, i) => {
      let medal = "";
      let tint = "transparent";
      if (i === 0) { medal = "🥇"; tint = "rgba(255,215,0,0.06)"; }
      else if (i === 1) { medal = "🥈"; tint = "rgba(192,192,192,0.06)"; }
      else if (i === 2) { medal = "🥉"; tint = "rgba(205,127,50,0.06)"; }
      
      return {
        ...s,
        rank: i + 1,
        kg: Math.round(s.kg),
        delta: 0, // Placeholder
        medal,
        tint
      };
    });
  }, [data]);

  const maxKg = rankings.length > 0 ? Math.max(...rankings.map((r) => r.kg), 1) : 1;

  if (isLoading) return <SkeletonCard className="h-48" />;
  if (isError) return <ErrorCard onRetry={() => refetch()} />;

  return (
    <div>
      <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
        This month's rankings
      </h3>
      <div
        className="rounded-xl border bg-card overflow-hidden"
        style={{ borderColor: "rgba(34,197,94,0.12)" }}
      >
        {rankings.map((r, i) => (
          <div
            key={r.name}
            className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0"
            style={{ borderColor: "rgba(34,197,94,0.06)", backgroundColor: r.tint }}
          >
            {/* Rank */}
            <span className="font-mono text-xl font-bold text-muted-foreground/40 w-8 text-center">
              {String(r.rank).padStart(2, "0")}
            </span>

            {/* Medal */}
            <span className="text-lg">{r.medal}</span>

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{ backgroundColor: `${r.color}22`, color: r.color }}
            >
              {r.initials}
            </div>

            {/* Name */}
            <span className="text-sm text-foreground font-medium w-32 truncate">{r.name}</span>

            {/* Kg */}
            <span className="font-mono text-sm text-foreground w-20">{r.kg} kg</span>

            {/* Delta */}
            <span
              className={`font-mono text-xs w-16 ${r.delta < 0 ? "text-primary" : "text-destructive"}`}
            >
              {r.delta < 0 ? "▼" : "▲"} {Math.abs(r.delta)}%
            </span>

            {/* Bar */}
            <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: r.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(r.kg / maxKg) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.12 }}
              />
            </div>
          </div>
        ))}
      </div>
      {rankings.length > 0 && (
        <p className="text-xs text-muted-foreground/60 italic mt-3 text-center">
          {rankings[0].name} is this month's household champion.
        </p>
      )}
    </div>
  );
};

export default Leaderboard;
