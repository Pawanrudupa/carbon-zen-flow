import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorCard from "@/components/ui/ErrorCard";

interface ActivityFeedProps {
  householdId: string;
}

const MEMBER_COLORS = [
  "hsl(142, 71%, 45%)",
  "hsl(217, 91%, 60%)",
  "hsl(255, 82%, 76%)",
  "hsl(45, 93%, 47%)",
  "hsl(0, 84%, 60%)",
];

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍽️",
  transport: "🚗",
  energy: "⚡",
  shopping: "🛍️",
  other: "📦",
};

const CATEGORY_COLORS: Record<string, string> = {
  food: "hsl(142,71%,45%)",
  transport: "hsl(217,91%,60%)",
  energy: "hsl(45,93%,47%)",
  shopping: "hsl(255,82%,76%)",
  other: "hsl(0,0%,60%)",
};

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days >= 2) return `${days}d ago`;
  if (days === 1) return "Yesterday";
  if (hours >= 1) return `${hours}h ago`;
  if (mins >= 1) return `${mins}m ago`;
  return "Just now";
}

const ActivityFeed = ({ householdId }: ActivityFeedProps) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["household-activity", householdId],
    queryFn: async () => {
      // Get member list with usernames
      const { data: members, error: memErr } = await supabase
        .from("household_members" as any)
        .select("user_id, profiles(username)")
        .eq("household_id", householdId);
      if (memErr) throw memErr;

      const userIds = (members as any[]).map((m: any) => m.user_id);
      if (userIds.length === 0) return { members: [], entries: [] };

      // Fetch last 20 entries from all members
      const { data: entries, error: entErr } = await supabase
        .from("entries")
        .select("id, user_id, category, description, co2_kg, logged_at")
        .in("user_id", userIds)
        .order("logged_at", { ascending: false })
        .limit(15);
      if (entErr) throw entErr;

      return { members: members as any[], entries: entries || [] };
    },
    enabled: !!householdId,
    refetchInterval: 30_000, // poll every 30s
  });

  const feed = useMemo(() => {
    if (!data) return [];

    const colorMap: Record<string, string> = {};
    const nameMap: Record<string, string> = {};
    (data.members as any[]).forEach((m: any, i: number) => {
      let uname = "Household Member";
      if (m.profiles) {
        uname = Array.isArray(m.profiles) ? (m.profiles[0]?.username || uname) : (m.profiles.username || uname);
      }
      nameMap[m.user_id] = uname;
      colorMap[m.user_id] = MEMBER_COLORS[i % MEMBER_COLORS.length];
    });

    return (data.entries as any[]).map((e: any) => ({
      id: e.id,
      userId: e.user_id,
      name: nameMap[e.user_id] || "Household Member",
      color: colorMap[e.user_id] || MEMBER_COLORS[0],
      initials: (nameMap[e.user_id] || "M").substring(0, 2).toUpperCase(),
      category: (e.category || "other").toLowerCase(),
      description: e.description || "an activity",
      co2: e.co2_kg || 0,
      timeAgo: timeAgo(e.logged_at),
      loggedAt: e.logged_at,
    }));
  }, [data]);

  if (isLoading) return <SkeletonCard className="h-64" />;
  if (isError) return <ErrorCard onRetry={() => refetch()} />;

  return (
    <div
      className="rounded-xl border bg-card p-5"
      style={{ borderColor: "rgba(34,197,94,0.12)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
          <Activity size={16} className="text-primary" />
          Recent Activity
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground/60 italic">
          Updates every 30s
        </span>
      </div>

      {feed.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Start logging entries to see the household feed
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {feed.map((item, i) => {
            const emoji = CATEGORY_EMOJI[item.category] || CATEGORY_EMOJI.other;
            const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="flex items-start gap-3 py-3 border-b border-primary/5 last:border-b-0"
              >
                {/* Timeline dot + line */}
                <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: `${item.color}22`, color: item.color }}
                  >
                    {item.initials}
                  </div>
                  {i < feed.length - 1 && (
                    <div className="w-px flex-1 mt-1 bg-primary/10 min-h-[16px]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs font-medium text-foreground">{item.name}</span>
                    <span className="text-[10px] text-muted-foreground">logged</span>
                    <span className="text-sm">{emoji}</span>
                    <span className="text-xs text-foreground/80 truncate max-w-[180px]">
                      {item.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {item.timeAgo}
                    </span>
                    <span
                      className="text-[10px] font-mono font-semibold"
                      style={{ color: catColor }}
                    >
                      {item.co2 === 0 ? "0" : item.co2.toFixed(1)} kg
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-mono capitalize"
                      style={{ backgroundColor: `${catColor}18`, color: catColor }}
                    >
                      {item.category}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
