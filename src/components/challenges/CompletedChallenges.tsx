import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const completed = [
  { title: "Veggie week", cat: "Food", catColor: "bg-primary/15 text-primary", date: "Completed 28 Mar", saved: "-18.4 kg", xp: "+200 XP" },
  { title: "Transit week", cat: "Transport", catColor: "bg-[hsl(var(--chart-blue))]/15 text-[hsl(var(--chart-blue))]", date: "Completed 15 Mar", saved: "-24.1 kg", xp: "+250 XP" },
  { title: "Lights out 9pm", cat: "Energy", catColor: "bg-[hsl(var(--chart-amber))]/15 text-[hsl(var(--chart-amber))]", date: "Completed 1 Mar", saved: "-2.8 kg", xp: "+100 XP" },
  { title: "No online shopping", cat: "Shopping", catColor: "bg-[hsl(var(--chart-purple))]/15 text-[hsl(var(--chart-purple))]", date: "Completed 14 Feb", saved: "-31.0 kg", xp: "+200 XP" },
  { title: "Bike to work", cat: "Transport", catColor: "bg-[hsl(var(--chart-blue))]/15 text-[hsl(var(--chart-blue))]", date: "Completed 28 Jan", saved: "-9.3 kg", xp: "+150 XP" },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const CompletedChallenges = () => {
  return (
    <div>
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
        Your victories — Completed (5)
      </h3>

      <motion.div
        className="space-y-0"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {completed.map((c, i) => (
          <motion.div
            key={c.title}
            variants={fadeUp}
            className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-primary/5 transition-colors group"
          >
            {/* Timeline dot + line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <CheckCircle2 size={20} className="text-primary" />
              {i < completed.length - 1 && (
                <div className="w-px h-6 bg-primary/15 mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-heading text-sm text-foreground font-medium">{c.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono ${c.catColor}`}>
                  {c.cat}
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/40">{c.date}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="font-mono text-xs text-primary">{c.saved} saved</span>
              <span className="font-mono text-xs text-[hsl(var(--chart-amber))]">{c.xp}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Total impact summary */}
      <motion.div
        className="glass-card rounded-xl p-5 mt-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <p className="text-sm text-foreground/80 text-center">
          Through <span className="font-mono text-primary font-semibold">5</span> completed challenges you've saved{" "}
          <span className="font-mono text-primary font-semibold">85.6 kg CO₂</span>{" "}
          — <span className="italic text-muted-foreground">equivalent to planting 4 trees.</span>
        </p>
      </motion.div>
    </div>
  );
};

export default CompletedChallenges;
