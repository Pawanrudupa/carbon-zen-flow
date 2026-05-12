import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Flame, Star, Trophy, Zap } from "lucide-react";

const LEVEL_TITLES = [
  "Beginner",
  "Carbon Aware",
  "Eco Warrior",
  "Carbon Reducer",
  "Climate Champion",
  "Planet Guardian",
  "Earth Hero",
  "Sustainability Legend",
];

// Confetti particle
const Particle = ({ style }: { style: React.CSSProperties }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-sm pointer-events-none"
    style={style}
    initial={{ y: 0, opacity: 1 }}
    animate={{ y: -200, opacity: 0, rotate: 720, x: (Math.random() - 0.5) * 300 }}
    transition={{ duration: 1.4, ease: "easeOut" }}
  />
);

const CONFETTI_COLORS = ["#22C55E", "#86EFAC", "#FCD34D", "#67E8F9", "#C084FC", "#F97316"];

const ChallengesHeader = () => {
  const { user } = useAuth();
  const [levelUpShown, setLevelUpShown] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevLevel, setPrevLevel] = useState(1);

  const { data: statsData } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_stats" as any)
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data as any;
    },
    enabled: !!user,
  });

  const { data: challengeData } = useQuery({
    queryKey: ["user-challenges-summary", user?.id],
    queryFn: async () => {
      if (!user) return { activeCount: 0, completedCount: 0, totalXP: 0 };
      const { data: userChallenges } = await supabase
        .from("user_challenges")
        .select("completed_at, xp_earned")
        .eq("user_id", user.id);
      if (!userChallenges) return { activeCount: 0, completedCount: 0, totalXP: 0 };
      const active = userChallenges.filter((c) => !c.completed_at).length;
      const completed = userChallenges.filter((c) => c.completed_at).length;
      const totalXP = userChallenges
        .filter((c) => c.completed_at)
        .reduce((sum, c) => sum + (c.xp_earned || 0), 0);
      return { activeCount: active, completedCount: completed, totalXP };
    },
    enabled: !!user,
  });

  // Use user_stats total_xp if available, fallback to computed
  const currentXP = (statsData as any)?.total_xp ?? challengeData?.totalXP ?? 0;
  const currentStreak = (statsData as any)?.current_streak ?? 0;
  const level = Math.floor(currentXP / 1000) + 1;
  const xpInLevel = currentXP % 1000;
  const pct = Math.min(100, (xpInLevel / 1000) * 100);
  const remaining = 1000 - xpInLevel;
  const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
  const nextTitle = LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)];

  // Level-up detection
  useEffect(() => {
    if (level > prevLevel && prevLevel !== 1) {
      setShowConfetti(true);
      setLevelUpShown(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
    setPrevLevel(level);
  }, [level]);

  // Spring for XP bar
  const xpSpring = useSpring(0, { stiffness: 60, damping: 20 });
  useEffect(() => {
    xpSpring.set(pct);
  }, [pct]);

  const confettiParticles = Array.from({ length: 24 }, (_, i) => ({
    key: i,
    style: {
      left: `${Math.random() * 100}%`,
      top: "50%",
      backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    } as React.CSSProperties,
  }));

  return (
    <div className="relative">
      {/* Confetti burst */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
            {confettiParticles.map((p) => (
              <Particle key={p.key} style={p.style} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Level-up overlay */}
      <AnimatePresence>
        {levelUpShown && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLevelUpShown(false)}
          >
            <motion.div
              className="glass-card rounded-2xl p-10 text-center max-w-sm mx-4"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                🏆
              </motion.div>
              <h2 className="font-heading text-3xl font-bold text-foreground mb-2">Level Up!</h2>
              <p className="text-muted-foreground mb-1">You are now</p>
              <p className="font-heading text-2xl font-bold text-gradient-green">
                Level {level} — {levelTitle}
              </p>
              <p className="text-xs text-muted-foreground mt-3 mb-6">
                Next: <span className="text-primary">{nextTitle}</span> in {remaining} XP
              </p>
              <button
                onClick={() => setLevelUpShown(false)}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-mono font-semibold hover:bg-primary/90 transition-colors"
              >
                Keep Going! 💪
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
        <div>
          <h1 className="font-heading text-[32px] font-bold text-foreground leading-tight">
            Challenges
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Small habits. Massive impact.</p>
        </div>
        <div className="flex gap-2">
          <motion.span
            className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-mono"
            whileHover={{ scale: 1.05 }}
          >
            {challengeData?.activeCount ?? 0} Active
          </motion.span>
          <motion.span
            className="px-3 py-1.5 rounded-full border border-primary/30 text-primary text-xs font-mono"
            whileHover={{ scale: 1.05 }}
          >
            {challengeData?.completedCount ?? 0} Completed
          </motion.span>
        </div>
      </div>

      {/* XP / Level card */}
      <motion.div
        className="glass-card rounded-xl p-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={14} className="text-[hsl(var(--chart-amber))]" />
            <span className="font-mono text-xs font-semibold text-foreground">
              Level {level} — {levelTitle}
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {remaining} XP to Level {level + 1}
          </span>
        </div>

        {/* XP bar */}
        <div
          className="h-3 bg-muted/20 rounded-full overflow-hidden"
          style={{ boxShadow: "inset 0 0 12px rgba(34,197,94,0.08)" }}
        >
          <motion.div
            className="h-full rounded-full bg-primary relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ boxShadow: "0 0 12px rgba(34,197,94,0.5)" }}
          >
            {/* Shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
          </motion.div>
        </div>

        <div className="flex justify-between mt-1.5 mb-3">
          <span className="font-mono text-[10px] text-muted-foreground/50">{xpInLevel} XP</span>
          <span className="font-mono text-[10px] text-muted-foreground/50">1000 XP</span>
        </div>

        {/* Bottom row: streak + next unlock */}
        <div className="flex items-center justify-between pt-3 border-t border-primary/10">
          {/* Streak */}
          <div className="flex items-center gap-2">
            <motion.span
              className="text-lg"
              animate={currentStreak > 0 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🔥
            </motion.span>
            <div>
              <span className="font-mono text-xs text-foreground font-semibold">
                {currentStreak} day streak
              </span>
              {currentStreak >= 7 && (
                <p className="text-[10px] text-primary font-mono">Keep it going! 🌟</p>
              )}
            </div>
          </div>

          {/* Next unlock */}
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground/60 font-mono">Next unlock</p>
            <p className="text-[10px] text-primary font-mono">
              "{nextTitle}" in {remaining} XP
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChallengesHeader;
