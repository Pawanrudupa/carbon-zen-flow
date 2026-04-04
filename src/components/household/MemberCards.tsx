import { motion } from "framer-motion";
import { Flame } from "lucide-react";

const members = [
  {
    name: "Alex Chen",
    initials: "AC",
    color: "hsl(142, 71%, 45%)",
    admin: true,
    streak: 14,
    kg: 312,
    pctOfTotal: 37,
    delta: -8,
    topSource: "Transport",
    topKg: 89,
    you: true,
  },
  {
    name: "Priya Sharma",
    initials: "PS",
    color: "hsl(217, 91%, 60%)",
    admin: false,
    streak: 9,
    kg: 290,
    pctOfTotal: 34,
    delta: -3,
    topSource: "Food",
    topKg: 102,
    you: false,
  },
  {
    name: "Sam Lee",
    initials: "SL",
    color: "hsl(255, 82%, 76%)",
    admin: false,
    streak: 22,
    kg: 245,
    pctOfTotal: 29,
    delta: -14,
    topSource: "Energy",
    topKg: 78,
    you: false,
  },
];

const cardAnim = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const MemberCards = () => {
  return (
    <div>
      <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Who's tracking</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {members.map((m, i) => (
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

            {/* View profile */}
            <div className="mt-auto pt-3 text-right">
              <button className="text-[11px] text-primary/60 hover:text-primary transition-colors">
                View profile →
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MemberCards;
