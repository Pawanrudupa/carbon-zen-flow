import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, AlertTriangle, X, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const CAT_COLORS: Record<string, { progress: string; badge: string; ring: string; glow: string }> = {
  food: {
    progress: "bg-primary",
    badge: "bg-primary/15 text-primary",
    ring: "#22C55E",
    glow: "rgba(34,197,94,0.2)",
  },
  transport: {
    progress: "bg-[hsl(217,91%,60%)]",
    badge: "bg-[hsl(217,91%,60%)]/15 text-[hsl(217,91%,60%)]",
    ring: "hsl(217,91%,60%)",
    glow: "rgba(59,130,246,0.2)",
  },
  energy: {
    progress: "bg-[hsl(38,95%,51%)]",
    badge: "bg-[hsl(38,95%,51%)]/15 text-[hsl(38,95%,51%)]",
    ring: "hsl(38,95%,51%)",
    glow: "rgba(245,158,11,0.2)",
  },
  shopping: {
    progress: "bg-[hsl(255,82%,76%)]",
    badge: "bg-[hsl(255,82%,76%)]/15 text-[hsl(255,82%,76%)]",
    ring: "hsl(255,82%,76%)",
    glow: "rgba(167,139,250,0.2)",
  },
  lifestyle: {
    progress: "bg-[hsl(173,80%,40%)]",
    badge: "bg-[hsl(173,80%,40%)]/15 text-[hsl(173,80%,40%)]",
    ring: "hsl(173,80%,40%)",
    glow: "rgba(20,184,166,0.2)",
  },
};

const MiniRing = ({ pct, color }: { pct: number; color: string }) => {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="50" height="50" viewBox="0 0 48 48" className="flex-shrink-0 drop-shadow-sm">
      <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth={3} className="text-muted/20" />
      <motion.circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${circ}` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <text
        x="24"
        y="24"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground"
        style={{ fontSize: 9, fontFamily: "JetBrains Mono" }}
      >
        {pct}%
      </text>
    </svg>
  );
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const ActiveChallenges = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [abandonId, setAbandonId] = useState<string | null>(null);
  const [abandonTitle, setAbandonTitle] = useState("");

  const { data: activeChallenges = [], isLoading } = useQuery({
    queryKey: ["active-challenges", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: userChallenges, error } = await supabase
        .from("user_challenges")
        .select("*, challenges(*)")
        .eq("user_id", user.id)
        .is("completed_at", null);

      if (error || !userChallenges) return [];

      return Promise.all(
        userChallenges.map(async (uc: any) => {
          const ch = uc.challenges;
          if (!ch) return null;

          // Try RPC for smart progress, fallback to time-based
          let progress = 0;
          try {
            const { data: rpcData } = await supabase.rpc(
              "calculate_challenge_progress" as any,
              { p_user_id: user.id, p_challenge_id: uc.challenge_id }
            );
            progress = Math.round(Number(rpcData) || 0);
          } catch {
            const elapsed = Math.floor(
              (Date.now() - new Date(uc.started_at || Date.now()).getTime()) / 86400000
            );
            progress = Math.min(100, Math.round((elapsed / (ch.duration_days || 7)) * 100));
          }

          const daysElapsed = Math.floor(
            (Date.now() - new Date(uc.started_at || Date.now()).getTime()) / 86400000
          );
          const daysLeft = Math.max(0, (ch.duration_days || 7) - daysElapsed);
          const cat = ch.category?.toLowerCase() || "food";
          const colors = CAT_COLORS[cat] || CAT_COLORS.food;

          // Status with urgency logic
          let status = "In Progress";
          let statusCls = "bg-muted/30 text-muted-foreground";
          if (progress >= 90) {
            status = "Almost there! 🔥";
            statusCls = "bg-primary/15 text-primary";
          } else if (progress >= 50) {
            status = "On Track ✓";
            statusCls = "bg-primary/10 text-primary";
          } else if (daysLeft <= 2 && daysLeft > 0) {
            status = "Final Push! ⚡";
            statusCls = "bg-destructive/15 text-destructive";
          } else if (daysLeft === 0) {
            status = "Ending Today!";
            statusCls = "bg-destructive/20 text-destructive";
          }

          const daysLeftColor =
            daysLeft > 7
              ? "text-muted-foreground"
              : daysLeft > 2
              ? "text-[hsl(38,95%,51%)]"
              : "text-destructive";

          return {
            ucId: uc.id,
            challengeId: ch.id,
            title: ch.title || "Untitled",
            description: ch.description || "",
            category: ch.category || "general",
            categoryLabel:
              ch.category?.charAt(0).toUpperCase() + ch.category?.slice(1),
            badge: ch.badge_emoji || "🎯",
            xpReward: ch.xp_reward || 200,
            targetSaving: ch.target_co2_saving || 0,
            progress,
            daysElapsed,
            daysLeft,
            daysLeftColor,
            status,
            statusCls,
            colors,
          };
        })
      ).then((r) => r.filter(Boolean) as NonNullable<(typeof r)[0]>[]);
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  const abandonMutation = useMutation({
    mutationFn: async (ucId: string) => {
      const { error } = await supabase
        .from("user_challenges")
        .delete()
        .eq("id", ucId)
        .eq("user_id", user?.id || "");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.info("Challenge abandoned. You can restart it anytime.");
      queryClient.invalidateQueries({ queryKey: ["active-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["available-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["user-challenges-summary"] });
      setAbandonId(null);
    },
    onError: (e: any) => toast.error("Failed: " + e.message),
  });

  const completeMutation = useMutation({
    mutationFn: async ({ ucId, xpReward, saving }: { ucId: string; xpReward: number; saving: number }) => {
      const { error } = await supabase
        .from("user_challenges")
        .update({
          completed_at: new Date().toISOString(),
          xp_earned: xpReward,
          co2_saved: saving,
          progress: 100,
        })
        .eq("id", ucId)
        .eq("user_id", user?.id || "");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("🏆 Challenge completed! XP awarded!", {
        description: "Check your victories below.",
      });
      queryClient.invalidateQueries({ queryKey: ["active-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["completed-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["user-challenges-summary"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
    onError: (e: any) => toast.error("Failed: " + e.message),
  });

  return (
    <div>
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
        Active Challenges ({activeChallenges.length})
      </h3>

      {/* Abandon confirmation */}
      <AnimatePresence>
        {abandonId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-card rounded-2xl p-7 max-w-sm mx-4 text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="text-4xl mb-3">😔</div>
              <h3 className="font-heading text-lg font-bold text-foreground mb-1">
                Abandon challenge?
              </h3>
              <p className="text-xs text-muted-foreground mb-5">
                "<span className="text-foreground font-medium">{abandonTitle}</span>" will be removed. You can restart anytime.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setAbandonId(null)}
                  className="flex-1 py-2 rounded-lg border border-primary/20 text-muted-foreground text-xs font-mono hover:border-primary/40 transition-colors"
                >
                  Keep Going
                </button>
                <button
                  onClick={() => abandonMutation.mutate(abandonId)}
                  disabled={abandonMutation.isPending}
                  className="flex-1 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono hover:bg-destructive/20 transition-colors"
                >
                  {abandonMutation.isPending ? "Removing…" : "Abandon"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card rounded-xl p-5 h-48 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && activeChallenges.length === 0 && (
        <motion.div
          className="text-center py-16 glass-card rounded-xl border border-primary/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-5xl mb-4"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            🎯
          </motion.div>
          <p className="text-sm font-semibold text-foreground mb-1">No active challenges yet</p>
          <p className="text-xs text-muted-foreground/60 mb-4">
            Start one below to begin earning XP and saving CO₂!
          </p>
          <div className="flex items-center justify-center gap-1 text-xs text-primary font-mono">
            Browse Challenges ↓
          </div>
        </motion.div>
      )}

      {/* Challenge cards */}
      {!isLoading && activeChallenges.length > 0 && (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {activeChallenges.map((c) => (
            <motion.div
              key={c.ucId}
              variants={fadeUp}
              className="glass-card rounded-xl p-5 relative overflow-hidden"
              whileHover={{ boxShadow: `0 4px 24px ${c.colors.glow}` }}
            >
              {/* Mini ring top-right */}
              <div className="absolute top-4 right-4">
                <MiniRing pct={c.progress} color={c.colors.ring} />
              </div>

              {/* Top content */}
              <div className="flex items-start gap-3 pr-16 mb-3">
                {/* Badge emoji */}
                <motion.div
                  className="text-3xl select-none flex-shrink-0"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  {c.badge}
                </motion.div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h4 className="font-heading text-sm font-bold text-foreground">{c.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono ${c.colors.badge}`}>
                      {c.categoryLabel}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">{c.description}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="h-2.5 bg-muted/20 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${c.colors.progress} relative overflow-hidden`}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.progress}%` }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                    />
                  </motion.div>
                </div>

                {/* Progress stats */}
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-mono text-[10px] text-muted-foreground/50">
                    {c.daysElapsed}d done
                  </span>
                  <span className={`font-mono text-[10px] font-semibold ${c.daysLeftColor}`}>
                    {c.daysLeft > 0 ? `${c.daysLeft}d left` : "Ends today!"}
                  </span>
                </div>
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-primary">-{c.targetSaving} kg CO₂</span>
                  <span className="flex items-center gap-0.5 font-mono text-[10px] text-[hsl(38,95%,51%)]">
                    <Zap size={9} /> +{c.xpReward} XP
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${c.statusCls}`}>
                  {c.status}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-primary/8">
                {c.progress >= 100 && (
                  <motion.button
                    onClick={() =>
                      completeMutation.mutate({
                        ucId: c.ucId,
                        xpReward: c.xpReward,
                        saving: c.targetSaving,
                      })
                    }
                    disabled={completeMutation.isPending}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-mono font-semibold hover:bg-primary/90 transition-colors"
                  >
                    🏆 Claim Reward!
                  </motion.button>
                )}
                <button
                  onClick={() => {
                    setAbandonId(c.ucId);
                    setAbandonTitle(c.title);
                  }}
                  className="ml-auto px-3 py-1.5 rounded-lg text-muted-foreground/40 text-[10px] font-mono hover:text-destructive/70 hover:bg-destructive/10 transition-colors flex items-center gap-1"
                >
                  <X size={10} /> Abandon
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ActiveChallenges;
