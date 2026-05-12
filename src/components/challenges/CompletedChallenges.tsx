import { motion } from "framer-motion";
import { CheckCircle2, Trophy, Leaf } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const CAT_BADGE: Record<string, string> = {
  food: "bg-primary/15 text-primary",
  transport: "bg-[hsl(217,91%,60%)]/15 text-[hsl(217,91%,60%)]",
  energy: "bg-[hsl(38,95%,51%)]/15 text-[hsl(38,95%,51%)]",
  shopping: "bg-[hsl(255,82%,76%)]/15 text-[hsl(255,82%,76%)]",
  lifestyle: "bg-[hsl(173,80%,40%)]/15 text-[hsl(173,80%,40%)]",
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

const CompletedChallenges = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["completed-challenges", user?.id],
    queryFn: async () => {
      if (!user) return { challenges: [], totalCO2: 0, totalXP: 0, count: 0 };

      const { data: userChallenges, error } = await supabase
        .from("user_challenges")
        .select("*, challenges(*)")
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      if (error || !userChallenges)
        return { challenges: [], totalCO2: 0, totalXP: 0, count: 0 };

      const challenges = userChallenges
        .map((uc: any) => {
          const ch = uc.challenges;
          if (!ch) return null;
          const cat = ch.category?.toLowerCase() || "food";
          return {
            title: ch.title || "Untitled",
            badge: ch.badge_emoji || "🏆",
            catLabel: ch.category?.charAt(0).toUpperCase() + ch.category?.slice(1),
            catBadge: CAT_BADGE[cat] || CAT_BADGE.food,
            completedAt: uc.completed_at,
            when: timeAgo(uc.completed_at),
            saved: Number(uc.co2_saved || ch.target_co2_saving || 0),
            xp: uc.xp_earned || ch.xp_reward || 200,
          };
        })
        .filter(Boolean) as NonNullable<ReturnType<typeof Array.prototype.map>[0]>[];

      const totalCO2 = challenges.reduce((s, c: any) => s + c.saved, 0);
      const totalXP = challenges.reduce((s, c: any) => s + c.xp, 0);

      return { challenges, totalCO2, totalXP, count: challenges.length };
    },
    enabled: !!user,
  });

  const completed = data?.challenges || [];
  const totalCO2 = data?.totalCO2 || 0;
  const totalXP = data?.totalXP || 0;
  const count = data?.count || 0;
  const treesEquiv = Math.max(1, Math.ceil(totalCO2 / 21));

  return (
    <div>
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
        Your Victories — Completed ({count})
      </h3>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 glass-card rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && completed.length === 0 && (
        <motion.div
          className="text-center py-14 glass-card rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-5xl mb-4"
            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🌟
          </motion.div>
          <p className="text-sm font-semibold text-foreground mb-1">No victories yet</p>
          <p className="text-xs text-muted-foreground/60">
            Complete an active challenge to see it shine here!
          </p>
        </motion.div>
      )}

      {!isLoading && completed.length > 0 && (
        <>
          {/* Timeline */}
          <motion.div
            className="space-y-0 mb-5"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {completed.map((c: any, i: number) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="flex items-start gap-4 group py-3 px-4 rounded-xl hover:bg-primary/5 transition-colors cursor-default"
              >
                {/* Timeline icon + line */}
                <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18, delay: i * 0.06 }}
                  >
                    <CheckCircle2
                      size={20}
                      className="text-primary"
                      style={{ filter: "drop-shadow(0 0 4px rgba(34,197,94,0.4))" }}
                    />
                  </motion.div>
                  {i < completed.length - 1 && (
                    <div className="w-px flex-1 mt-1 bg-gradient-to-b from-primary/30 to-primary/5 min-h-[20px]" />
                  )}
                </div>

                {/* Badge */}
                <div className="text-2xl flex-shrink-0 mt-0.5">{c.badge}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading text-sm font-semibold text-foreground">
                      {c.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono ${c.catBadge}`}>
                      {c.catLabel}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground/40">{c.when}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 flex-shrink-0 text-right">
                  {c.saved > 0 && (
                    <span className="font-mono text-xs text-primary font-semibold">
                      -{c.saved.toFixed(1)} kg
                    </span>
                  )}
                  <span className="font-mono text-xs text-[hsl(38,95%,51%)] font-semibold">
                    +{c.xp} XP
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Impact summary card */}
          <motion.div
            className="glass-card rounded-xl p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ borderColor: "rgba(34,197,94,0.2)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-[hsl(38,95%,51%)]" />
              <span className="font-heading text-sm font-semibold text-foreground">
                Your Impact Summary
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="font-mono text-2xl font-bold text-foreground">{count}</p>
                <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">Challenges</p>
              </div>
              <div className="text-center border-x border-primary/10">
                <p className="font-mono text-2xl font-bold text-primary">
                  {totalCO2.toFixed(1)}
                </p>
                <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">kg CO₂ saved</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-2xl font-bold text-[hsl(38,95%,51%)]">{totalXP}</p>
                <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">XP earned</p>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-center py-3 px-4 rounded-lg bg-primary/8 border border-primary/15">
              <Leaf size={13} className="text-primary" />
              <p className="text-xs text-foreground/80 text-center">
                Equivalent to planting{" "}
                <span className="font-mono text-primary font-bold">{treesEquiv}</span>{" "}
                {treesEquiv === 1 ? "tree" : "trees"} 🌳
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground/50 text-center mt-3 italic">
              Keep going — every challenge matters! 💪
            </p>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default CompletedChallenges;
