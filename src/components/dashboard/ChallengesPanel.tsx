import { motion } from "framer-motion";

const challenges = [
  { name: "Meatless Week", progress: 0.71, daysLeft: 2, saving: "8.4 kg" },
  { name: "Cycle Commute", progress: 0.4, daysLeft: 5, saving: "12.6 kg" },
  { name: "Unplug Everything", progress: 0.25, daysLeft: 6, saving: "3.2 kg" },
];

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.4 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const ChallengesPanel = () => (
  <div className="glass-card rounded-xl p-5 h-full flex flex-col">
    <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
      Challenges
    </h3>
    <div className="flex-1 flex flex-col gap-2.5">
      {challenges.map((c, i) => (
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
            <span className="text-xs text-foreground/80 font-heading font-600">{c.name}</span>
            <span className="font-mono text-[9px] text-muted-foreground/50">{c.daysLeft}d</span>
          </div>
          <div className="w-full h-1 rounded-full bg-muted/40 overflow-hidden mb-1.5">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${c.progress * 100}%` }}
              transition={{ delay: 0.6 + i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
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
      ))}
    </div>
    <button className="mt-3 text-[10px] text-primary/60 font-heading font-600 hover:text-primary transition-colors">
      All Challenges →
    </button>
  </div>
);

export default ChallengesPanel;
