import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const activities = [
  { time: "2m ago", icon: "🚲", action: "Bike to office", impact: "+0.0 kg", color: "text-blue-400" },
  { time: "15m ago", icon: "🍽️", action: "Plant lunch", impact: "+1.2 kg", color: "text-green-400" },
  { time: "1h ago", icon: "⚡", action: "Home electricity", impact: "+2.8 kg", color: "text-amber-400" },
];

const MissionControlPreview = () => {
  const [currentActivity, setCurrentActivity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [heroStats, setHeroStats] = useState({ 
    monthTotal: 312, monthTrend: "-18%",
    dailyAvg: 18.4, dailyTrend: "▼2.1",
    streak: 14, streakTrend: "🔥 best",
    isRealData: false
  });

  // Simulator loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivity((prev) => (prev + 1) % activities.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchRealStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log("No user session. Using mock data.");
        return;
      }

      console.log("🔥 [AUTH] User session detected, fetching stats!");

      try {
        setLoading(true);
        // 1. Fetch all user entries
        const { data: entries, error } = await supabase
          .from("entries")
          .select("*")
          .eq("user_id", session.user.id);

        if (error) throw error;
        console.log("✅ [DATA] Raw entries fetched:", entries);

        // Fetch user streak from user_stats
        const { data: streakData } = await supabase
          .from("user_stats" as any)
          .select("current_streak")
          .eq("user_id", session.user.id)
          .maybeSingle();

        // 2. Calculate the real stats
        if (entries && entries.length > 0) {
          const total = entries.reduce((sum, entry) => sum + (Number(entry.co2_kg) || 0), 0);
          
          if (isMounted) {
            const currentStreak = streakData?.current_streak ?? 0;
            setHeroStats({
              monthTotal: Math.round(total),
              monthTrend: "+100%", // Simplified for stability
              dailyAvg: Math.round((total / entries.length) * 10) / 10,
              dailyTrend: "▲0.0", // Simplified for stability
              streak: currentStreak,
              streakTrend: currentStreak > 0 ? "🔥 active" : "💤 inactive",
              isRealData: true
            });
          }
        } else if (isMounted) {
          const currentStreak = streakData?.current_streak ?? 0;
          setHeroStats({
            monthTotal: 0, monthTrend: "0%",
            dailyAvg: 0, dailyTrend: "▼0.0",
            streak: currentStreak, streakTrend: currentStreak > 0 ? "🔥 active" : "💤 inactive",
            isRealData: true
          });
        }
      } catch (error) {
        console.error("❌ [ERROR] Failed to fetch user stats:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Run immediately on page load
    fetchRealStats();

    // Listen for the exact moment the OAuth redirect finishes
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        fetchRealStats();
      } else if (event === "SIGNED_OUT" && isMounted) {
        setHeroStats({ 
          monthTotal: 312, monthTrend: "-18%", 
          dailyAvg: 18.4, dailyTrend: "▼2.1", 
          streak: 14, streakTrend: "🔥 best",
          isRealData: false 
        });
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="mission-card p-6 grid-background animate-fade-in"
    >
      {/* Terminal Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-primary/10">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-amber-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="status-dot green" />
          <span className="font-mono text-[10px] text-green-400 uppercase tracking-widest">
            LIVE TRACKING
          </span>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          label="THIS MONTH"
          value={heroStats.monthTotal.toString()}
          unit="kg"
          trend={heroStats.monthTrend}
          loading={loading}
        />
        <StatCard
          label="DAILY AVG"
          value={heroStats.dailyAvg.toString()}
          unit="kg"
          trend={heroStats.dailyTrend}
          loading={loading}
        />
        <StatCard
          label="STREAK"
          value={heroStats.streak.toString()}
          unit="days"
          trend={heroStats.streakTrend}
          loading={loading}
        />
      </div>

      {/* Category Breakdown */}
      <div className="mb-6">
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
          Category Breakdown — Real-time
        </p>
        <div className="space-y-2">
          <CategoryBar label="Food" value={124} color="bg-green-500" pct={40} />
          <CategoryBar label="Transport" value={89} color="bg-blue-500" pct={28} />
          <CategoryBar label="Energy" value={67} color="bg-amber-500" pct={21} />
          <CategoryBar label="Shopping" value={32} color="bg-purple-500" pct={10} />
        </div>
      </div>

      {/* Live Activity Stream */}
      <div>
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
          Live Activity Stream
        </p>
        <div className="min-h-[52px]">
          <AnimatePresence mode="wait">
            {activities.map(
              (activity, idx) =>
                idx === currentActivity && (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={`font-mono text-[12px] flex items-center gap-3 px-2 py-1.5 rounded ${activity.color}`}
                  >
                    <span className="text-muted-foreground text-[11px]">{activity.time}</span>
                    <span>{activity.icon}</span>
                    <span className="flex-1">{activity.action}</span>
                    <span className="text-right">{activity.impact}</span>
                  </motion.div>
                )
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const StatCard = ({
  label,
  value,
  unit,
  trend,
  loading,
}: {
  label: string;
  value: string;
  unit: string;
  trend: string;
  loading?: boolean;
}) => {
  const getTrendColor = (trendStr: string) => {
    if (trendStr.startsWith("▼") || trendStr.startsWith("-")) {
      return "text-green-400";
    }
    if (trendStr.startsWith("▲") || trendStr.startsWith("+")) {
      return "text-amber-400";
    }
    if (trendStr.includes("active") || trendStr.includes("best") || trendStr.includes("🔥")) {
      return "text-amber-400";
    }
    return "text-muted-foreground/60";
  };

  return (
    <div className="bg-background/50 rounded-lg p-3 border border-primary/10 flex flex-col justify-between min-h-[92px]">
      <div>
        <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 font-mono">
          {label}
        </p>
        {loading ? (
          <div className="h-6 w-14 bg-primary/15 animate-pulse rounded my-1" />
        ) : (
          <p className="mono-number text-xl text-foreground">{value}</p>
        )}
        <p className="text-[10px] text-muted-foreground font-mono">{unit}</p>
      </div>
      {loading ? (
        <div className="h-3 w-10 bg-primary/10 animate-pulse rounded mt-1.5" />
      ) : (
        <p className={`text-[10px] font-mono mt-1 ${getTrendColor(trend)}`}>
          {trend}
        </p>
      )}
    </div>
  );
};

const CategoryBar = ({
  label,
  value,
  color,
  pct,
}: {
  label: string;
  value: number;
  color: string;
  pct: number;
}) => (
  <div>
    <div className="flex items-center justify-between mb-1 gap-2">
      <span className="font-mono text-[11px] text-muted-foreground w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted/20 rounded-full overflow-hidden liquid-bar">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
      <span className="font-mono text-[11px] text-foreground/70 w-12 text-right flex-shrink-0">
        {value} kg
      </span>
      <span className="font-mono text-[10px] text-muted-foreground/50 w-8 text-right flex-shrink-0">
        {pct}%
      </span>
    </div>
  </div>
);

export default MissionControlPreview;
