import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.4 + i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const ChallengesPanel = () => {
  const { user } = useAuth();

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["dashboard-active-challenges", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: userChallenges, error } = await supabase
        .from("user_challenges")
        .select("*, challenges(*)")
        .eq("user_id", user.id)
        .is("completed_at", null)
        .order("started_at", { ascending: false })
        .limit(3);

      if (error || !userChallenges) return [];

      return Promise.all(
        userChallenges.map(async (uc: any) => {
          const ch = uc.challenges;
          if (!ch) return null;

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

          return {
            name: ch.title || "Untitled",
            progress: progress / 100,
            daysLeft,
            saving: `${ch.target_co2_saving || 0} kg`,
          };
        })
      ).then((r) => r.filter(Boolean) as NonNullable<(typeof r)[0]>[]);
    },
    enabled: !!user,
  });

  return (
    <div className="glass-card rounded-xl p-5 min-h-[16rem] h-auto md:h-full flex flex-col">
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
        Challenges
      </h3>
      <div className="flex-1 flex flex-col gap-2.5">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-lg h-[68px] animate-pulse bg-muted/10 border border-primary/5" />
          ))
        ) : challenges.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/50 font-mono text-center px-4">
            No active challenges. Head over to the challenges page to start one!
          </div>
        ) : (
          challenges.map((c, i) => (
            <motion.div
              key={i}
              className="glass-card rounded-lg p-3 group hover:border-primary/15 transition-colors"
              variants={cardVariant}
              initial="hidden"
              animate="show"
              custom={i}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-foreground/80 font-heading font-600 truncate mr-2">{c.name}</span>
                <span className="font-mono text-[9px] text-muted-foreground/50 whitespace-nowrap">{c.daysLeft}d left</span>
              </div>
              <div className="w-full h-1 rounded-full bg-muted/40 overflow-hidden mb-1.5">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${c.progress * 100}%` }}
                  transition={{ delay: 0.6 + i * 0.15, duration: 0.8, ease: "easeOut" }}
                  style={{ boxShadow: "0 0 8px rgba(34,197,94,0.3)" }}
                />
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-[9px] text-muted-foreground/50">
                  {Math.round(c.progress * 100)}%
                </span>
                <span className="font-mono text-[9px] text-primary/70">−{c.saving}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
      <Link 
        to="/challenges"
        className="mt-3 text-[10px] text-primary/60 font-heading font-600 hover:text-primary transition-colors block text-center"
      >
        All Challenges →
      </Link>
    </div>
  );
};

export default ChallengesPanel;
