import { motion } from "framer-motion";

const ChallengesHeader = () => {
  const currentXP = 2340;
  const nextLevelXP = 3000;
  const pct = (currentXP / nextLevelXP) * 100;
  const remaining = nextLevelXP - currentXP;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
        <div>
          <h1 className="font-heading text-[32px] font-bold text-foreground leading-tight">
            Challenges
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Small habits. Massive impact.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-mono">
            3 Active
          </span>
          <span className="px-3 py-1.5 rounded-full border border-primary/30 text-primary text-xs font-mono">
            5 Completed
          </span>
        </div>
      </div>

      {/* XP bar */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-foreground">
            Level 4 — Carbon Reducer
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {remaining.toLocaleString()} XP to Level 5
          </span>
        </div>
        <div className="h-3 bg-muted/20 rounded-full overflow-hidden" style={{ boxShadow: "0 0 12px rgba(34,197,94,0.15)" }}>
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ boxShadow: "0 0 8px rgba(34,197,94,0.4)" }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="font-mono text-[10px] text-muted-foreground/50">
            {currentXP.toLocaleString()} XP
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/50">
            {nextLevelXP.toLocaleString()} XP
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChallengesHeader;
