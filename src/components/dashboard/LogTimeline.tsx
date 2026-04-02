import { motion } from "framer-motion";
import { UtensilsCrossed, Car, Zap, ShoppingBag, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const icons: Record<string, typeof UtensilsCrossed> = {
  food: UtensilsCrossed,
  transport: Car,
  energy: Zap,
  shopping: ShoppingBag,
};

const colors: Record<string, string> = {
  food: "#22C55E",
  transport: "#3B82F6",
  energy: "#F59E0B",
  shopping: "#A78BFA",
};

const entries = [
  { time: "2h ago", cat: "food", desc: "Chicken stir-fry dinner", co2: 1.4, trend: "down" },
  { time: "5h ago", cat: "transport", desc: "Car commute to office", co2: 4.2, trend: "up" },
  { time: "8h ago", cat: "energy", desc: "Home electricity (8 kWh)", co2: 6.6, trend: "same" },
  { time: "Yesterday", cat: "food", desc: "Veggie lunch", co2: 0.5, trend: "down" },
  { time: "Yesterday", cat: "shopping", desc: "Used bookstore haul", co2: 0.3, trend: "down" },
];

const entryVariant = {
  hidden: { opacity: 0, x: -20 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const LogTimeline = () => (
  <div className="glass-card rounded-xl p-5 h-full flex flex-col">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em]">
        Recent Entries
      </h3>
      <Link
        to="/log"
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-heading font-600 hover:bg-primary/20 transition-colors"
      >
        <Plus size={11} /> Add
      </Link>
    </div>
    <div className="flex-1 space-y-1 overflow-y-auto">
      {entries.map((e, i) => {
        const Icon = icons[e.cat];
        return (
          <motion.div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors group cursor-pointer"
            variants={entryVariant}
            initial="hidden"
            animate="show"
            custom={i}
            whileHover={{ x: 4, transition: { duration: 0.15 } }}
          >
            {/* Time column */}
            <span className="font-mono text-[10px] text-muted-foreground/40 w-14 flex-shrink-0">
              {e.time}
            </span>

            {/* Category dot + line */}
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-shadow group-hover:shadow-[0_0_12px_rgba(34,197,94,0.15)]"
                style={{ backgroundColor: `${colors[e.cat]}12` }}
              >
                <Icon size={12} style={{ color: colors[e.cat] }} />
              </div>
            </div>

            {/* Description */}
            <div className="flex-1 min-w-0">
              <span className="text-xs text-foreground/70 block truncate">{e.desc}</span>
            </div>

            {/* CO2 value */}
            <span className="font-mono text-xs text-foreground/90 flex-shrink-0">
              {e.co2}<span className="text-muted-foreground/40 ml-0.5">kg</span>
            </span>

            {/* Trend */}
            <span
              className={`text-[10px] flex-shrink-0 ${
                e.trend === "down"
                  ? "text-primary"
                  : e.trend === "up"
                  ? "text-destructive"
                  : "text-muted-foreground/30"
              }`}
            >
              {e.trend === "down" ? "↓" : e.trend === "up" ? "↑" : "·"}
            </span>
          </motion.div>
        );
      })}
    </div>
  </div>
);

export default LogTimeline;
