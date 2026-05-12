import { motion } from "framer-motion";
import { Flame, UserMinus } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorCard from "@/components/ui/ErrorCard";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MemberCardsProps {
  householdId: string;
}

const colors = [
  "hsl(142, 71%, 45%)",
  "hsl(217, 91%, 60%)",
  "hsl(255, 82%, 76%)",
  "hsl(45, 93%, 47%)",
  "hsl(0, 84%, 60%)",
];

const cardAnim = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const MemberCards = ({ householdId }: MemberCardsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [removingId, setRemovingId] = useState<string | null>(null);
  
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["household-members", householdId],
    queryFn: async () => {
      const { data: members, error: memErr } = await supabase
        .from("household_members")
        .select("user_id, role, profiles(username)")
        .eq("household_id", householdId);
      if (memErr) throw memErr;

      const userIds = members.map(m => m.user_id);
      
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      
      const { data: entries, error: entErr } = await supabase
        .from("entries")
        .select("user_id, co2_kg, category, logged_at")
        .in("user_id", userIds)
        .gte("logged_at", start.toISOString());
      if (entErr) throw entErr;

      // Also determine viewer's role
      const viewerMember = (members as any[]).find((m: any) => m.user_id === user?.id);
      const viewerRole = viewerMember?.role || "member";
      return { members, entries, viewerRole };
    },
    enabled: !!householdId,
  });

  const isViewer = (data?.viewerRole === "owner" || data?.viewerRole === "admin");

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("household_members" as any)
        .delete()
        .eq("household_id", householdId)
        .eq("user_id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member removed.");
      setRemovingId(null);
      queryClient.invalidateQueries({ queryKey: ["household-members", householdId] });
      queryClient.invalidateQueries({ queryKey: ["household-leaderboard", householdId] });
      queryClient.invalidateQueries({ queryKey: ["household-overview", householdId] });
      queryClient.invalidateQueries({ queryKey: ["household-member-count"] });
    },
    onError: (err: any) => {
      toast.error("Failed to remove: " + err.message);
    },
  });

  const cards = useMemo(() => {
    if (!data || !user) return [];

    let totalKgAll = 0;
    const memberStats: Record<string, any> = {};

    data.members.forEach((m, i) => {
      let name = "Household Member";
      if (m.profiles) {
        name = Array.isArray(m.profiles) ? (m.profiles[0]?.username || name) : (m.profiles.username || name);
      }
      
      memberStats[m.user_id] = {
        id: m.user_id,
        name,
        initials: name.substring(0, 2).toUpperCase(),
        color: colors[i % colors.length],
        admin: m.role === "owner" || m.role === "admin",
        streak: 0, // Placeholder
        kg: 0,
        cats: {} as Record<string, number>,
        topSource: "None",
        topKg: 0,
        you: m.user_id === user.id
      };
    });

    data.entries.forEach(e => {
      const stats = memberStats[e.user_id];
      if (stats) {
        const val = e.co2_kg || 0;
        stats.kg += val;
        totalKgAll += val;

        const cat = e.category || "Other";
        if (!stats.cats[cat]) stats.cats[cat] = 0;
        stats.cats[cat] += val;
      }
    });

    return Object.values(memberStats).map((stats: any) => {
      const topCat = Object.entries(stats.cats).sort((a: any, b: any) => b[1] - a[1])[0];
      if (topCat) {
        stats.topSource = topCat[0].charAt(0).toUpperCase() + topCat[0].slice(1);
        stats.topKg = Math.round(topCat[1] as number);
      }
      
      stats.kg = Math.round(stats.kg);
      stats.pctOfTotal = totalKgAll > 0 ? Math.round((stats.kg / totalKgAll) * 100) : 0;
      stats.delta = 0; // Placeholder

      return stats;
    });
  }, [data, user]);

  if (isLoading) return <SkeletonCard className="h-64" />;
  if (isError) return <ErrorCard onRetry={() => refetch()} />;

  return (
    <>
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Who's tracking</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((m, i) => (
          <motion.div
            key={m.name}
            className="rounded-xl border bg-card p-5 flex flex-col"
            style={{ borderColor: "rgba(34,197,94,0.12)" }}
            variants={cardAnim}
            initial="hidden"
            animate="show"
            custom={i}
          >
            {/* Top row */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: `${m.color}22`, color: m.color }}
              >
                {m.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">{m.name}</span>
                  {m.you && <span className="text-[10px] text-muted-foreground">(you)</span>}
                  {m.admin && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
                      Admin
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Flame size={12} className="text-primary" />
                  <span className="font-mono">{m.streak} day streak</span>
                </div>
              </div>
            </div>

            {/* Kg total */}
            <div className="mt-4">
              <span className="font-mono text-2xl font-bold text-foreground">{m.kg}</span>
              <span className="text-xs text-muted-foreground ml-1">kg</span>
            </div>

            {/* Delta */}
            <span
              className={`text-xs font-mono mt-1 ${m.delta < 0 ? "text-primary" : "text-destructive"}`}
            >
              {m.delta < 0 ? "▼" : "▲"} {Math.abs(m.delta)}% vs average
            </span>

            {/* Contribution bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>Share of total</span>
                <span className="font-mono">{m.pctOfTotal}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: m.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${m.pctOfTotal}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                />
              </div>
            </div>

            {/* Top source */}
            <p className="text-xs text-muted-foreground mt-3">
              Top source: <span className="text-foreground">{m.topSource}</span>{" "}
              <span className="font-mono">· {m.topKg} kg</span>
            </p>

            {/* Admin: remove member */}
            <div className="mt-auto pt-3 flex items-center justify-between">
              {isViewer && !m.you && (
                <button
                  onClick={() => setRemovingId(m.id)}
                  className="text-[11px] text-destructive/60 hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <UserMinus size={12} />
                  Remove
                </button>
              )}
              {(!isViewer || m.you) && (
                <span className="text-[11px] text-muted-foreground/40 font-mono">
                  {m.you ? "(you)" : ""}
                </span>
              )}
            </div>
          </motion.div>
        ))}
        </div>
      </div>

      {/* Remove confirmation dialog */}
      {(() => {
        const target = cards.find((c) => c.id === removingId);
        return (
          <Dialog open={!!removingId} onOpenChange={(o) => !o && setRemovingId(null)}>
            <DialogContent className="bg-card border-primary/10 max-w-sm">
              <DialogHeader>
                <DialogTitle className="font-heading text-foreground">Remove member?</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm">
                  Remove <strong className="text-foreground">{target?.name}</strong> from the
                  household? They can rejoin with an invite link.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 mt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-primary/20"
                  onClick={() => setRemovingId(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => target && removeMutation.mutate(target.id)}
                  disabled={removeMutation.isPending}
                >
                  {removeMutation.isPending ? "Removing…" : "Remove"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </>
  );
};

export default MemberCards;

