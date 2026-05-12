import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, Star, Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const FILTERS = ["All", "Food", "Transport", "Energy", "Shopping", "Lifestyle"];

const CAT_STYLES: Record<string, { border: string; glow: string; badge: string; accent: string }> = {
  food: {
    border: "border-primary/30",
    glow: "rgba(34,197,94,0.15)",
    badge: "bg-primary/15 text-primary",
    accent: "#22C55E",
  },
  transport: {
    border: "border-[hsl(217,91%,60%)]/30",
    glow: "rgba(59,130,246,0.15)",
    badge: "bg-[hsl(217,91%,60%)]/15 text-[hsl(217,91%,60%)]",
    accent: "hsl(217,91%,60%)",
  },
  energy: {
    border: "border-[hsl(38,95%,51%)]/30",
    glow: "rgba(245,158,11,0.15)",
    badge: "bg-[hsl(38,95%,51%)]/15 text-[hsl(38,95%,51%)]",
    accent: "hsl(38,95%,51%)",
  },
  shopping: {
    border: "border-[hsl(255,82%,76%)]/30",
    glow: "rgba(167,139,250,0.15)",
    badge: "bg-[hsl(255,82%,76%)]/15 text-[hsl(255,82%,76%)]",
    accent: "hsl(255,82%,76%)",
  },
  lifestyle: {
    border: "border-[hsl(173,80%,40%)]/30",
    glow: "rgba(20,184,166,0.15)",
    badge: "bg-[hsl(173,80%,40%)]/15 text-[hsl(173,80%,40%)]",
    accent: "hsl(173,80%,40%)",
  },
};

const DIFF_CONFIG: Record<string, { dot: string; color: string }> = {
  Easy: { dot: "🟢", color: "text-primary" },
  Medium: { dot: "🟡", color: "text-[hsl(38,95%,51%)]" },
  Hard: { dot: "🔴", color: "text-destructive" },
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" as const } },
};

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string | null;
  target_co2_saving: number | null;
  duration_days: number;
  xp_reward: number;
  badge_emoji: string | null;
  is_featured: boolean | null;
  score?: number;
}

const ChallengeCard = ({
  c,
  onStart,
  isStarting,
  isRecommended,
}: {
  c: Challenge;
  onStart: (id: string) => void;
  isStarting: boolean;
  isRecommended: boolean;
}) => {
  const cat = c.category?.toLowerCase() || "food";
  const styles = CAT_STYLES[cat] || CAT_STYLES.food;
  const diff = DIFF_CONFIG[c.difficulty || "Medium"] || DIFF_CONFIG.Medium;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, boxShadow: `0 8px 32px ${styles.glow}` }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`glass-card rounded-xl p-5 flex flex-col relative overflow-hidden border ${styles.border}`}
      style={{ minHeight: 200 }}
    >
      {/* Featured gradient border shimmer */}
      {c.is_featured && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${styles.accent}22, transparent 60%)`,
          }}
        />
      )}

      {/* Recommended tag */}
      {isRecommended && (
        <div className="absolute top-3 right-3">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-mono border border-primary/20">
            <Sparkles size={8} /> For you
          </span>
        </div>
      )}

      {/* Emoji badge — floating animation */}
      <motion.div
        className="text-4xl mb-3 select-none"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: 48, textAlign: "center" }}
      >
        {c.badge_emoji || "🎯"}
      </motion.div>

      {/* Title + meta */}
      <h4 className="font-heading text-sm font-bold text-foreground leading-tight mb-1 pr-12">
        {c.title}
      </h4>
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono ${styles.badge}`}>
          {c.category?.charAt(0).toUpperCase() + c.category?.slice(1)}
        </span>
        <span className={`text-[10px] font-mono ${diff.color}`}>
          {diff.dot} {c.difficulty}
        </span>
        <span className="text-[10px] text-muted-foreground/40 font-mono">{c.duration_days}d</span>
      </div>

      <p className="text-xs text-muted-foreground/70 mb-4 flex-1 leading-relaxed">
        {c.description}
      </p>

      {/* Rewards row */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-xs text-primary font-semibold">
          -{c.target_co2_saving ?? 0} kg CO₂
        </span>
        <span className="flex items-center gap-1 font-mono text-xs text-[hsl(38,95%,51%)] font-semibold">
          <Zap size={10} /> +{c.xp_reward} XP
        </span>
      </div>

      {/* CTA */}
      <motion.button
        onClick={() => onStart(c.id)}
        disabled={isStarting}
        whileTap={{ scale: 0.97 }}
        className="w-full py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-mono font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {isStarting ? (
          <>
            <motion.div
              className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
            />
            Starting…
          </>
        ) : (
          <>
            Start Challenge
            <ArrowRight size={11} />
          </>
        )}
      </motion.button>
    </motion.div>
  );
};

const AvailableChallenges = () => {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [startingId, setStartingId] = useState<string | null>(null);

  const { data: allChallenges = [], isLoading } = useQuery({
    queryKey: ["available-challenges", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const [challengesRes, userChallengesRes, recentEntriesRes] = await Promise.all([
        supabase.from("challenges").select("*").order("is_featured", { ascending: false }),
        supabase.from("user_challenges").select("challenge_id").eq("user_id", user.id),
        supabase
          .from("entries")
          .select("category")
          .eq("user_id", user.id)
          .gte(
            "logged_at",
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          ),
      ]);

      const startedIds = new Set(
        (userChallengesRes.data || []).map((c: any) => c.challenge_id)
      );

      const categoryCounts: Record<string, number> = {};
      (recentEntriesRes.data || []).forEach((e: any) => {
        categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
      });

      return ((challengesRes.data || []) as Challenge[])
        .filter((c) => !startedIds.has(c.id))
        .map((c) => {
          let score = 0;
          if (c.is_featured) score += 100;
          if (categoryCounts[c.category] > 5) score += 50;
          if (!categoryCounts[c.category]) score += 30;
          return { ...c, score };
        })
        .sort((a, b) => (b.score || 0) - (a.score || 0));
    },
    enabled: !!user,
  });

  const startMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase.from("user_challenges").insert({
        user_id: user.id,
        challenge_id: challengeId,
        progress: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("🎯 Challenge started! Track your progress above.", {
        description: "Keep logging entries to make progress.",
      });
      queryClient.invalidateQueries({ queryKey: ["active-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["available-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["user-challenges-summary"] });
      setStartingId(null);
    },
    onError: (err: any) => {
      toast.error("Failed to start challenge: " + err.message);
      setStartingId(null);
    },
  });

  const handleStart = (id: string) => {
    setStartingId(id);
    startMutation.mutate(id);
  };

  const filtered = allChallenges.filter((c) => {
    const matchCat = activeFilter === "All" || c.category?.toLowerCase() === activeFilter.toLowerCase();
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = filtered.filter((c) => c.is_featured);
  const regular = filtered.filter((c) => !c.is_featured);
  const topRecommended = filtered.slice(0, 3).map((c) => c.id);

  return (
    <div>
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
        Start a new challenge
      </h3>

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search challenges..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted/20 text-sm font-mono text-foreground placeholder:text-muted-foreground/30 border border-primary/10 focus:border-primary/40 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <motion.button
              key={f}
              onClick={() => setActiveFilter(f)}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-200 ${
                activeFilter === f
                  ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(34,197,94,0.3)]"
                  : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {f}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-xl p-5 h-52 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <motion.div
          className="text-center py-16 glass-card rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-5xl mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            🔍
          </motion.div>
          <p className="text-sm font-semibold text-foreground mb-1">No challenges found</p>
          <p className="text-xs text-muted-foreground/60">
            {search ? `Try a different search term` : "You've started all challenges in this category!"}
          </p>
        </motion.div>
      )}

      {/* Featured section */}
      {!isLoading && featured.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Star size={12} className="text-[hsl(38,95%,51%)]" />
            <span className="text-[10px] font-mono text-[hsl(38,95%,51%)] uppercase tracking-widest">
              Featured
            </span>
          </div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {featured.map((c) => (
              <ChallengeCard
                key={c.id}
                c={c}
                onStart={handleStart}
                isStarting={startingId === c.id}
                isRecommended={topRecommended.includes(c.id)}
              />
            ))}
          </motion.div>
        </div>
      )}

      {/* All other challenges */}
      {!isLoading && regular.length > 0 && (
        <>
          {featured.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={12} className="text-muted-foreground/60" />
              <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
                All Challenges
              </span>
            </div>
          )}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {regular.map((c) => (
              <ChallengeCard
                key={c.id}
                c={c}
                onStart={handleStart}
                isStarting={startingId === c.id}
                isRecommended={topRecommended.includes(c.id)}
              />
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default AvailableChallenges;
