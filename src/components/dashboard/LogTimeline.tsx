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

const LogTimeline = () => (
  <div className="glass-card rounded-xl p-5 h-full flex flex-col">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest">Recent Entries</h3>
      <Link
        to="/log"
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-heading font-600 hover:bg-primary/20 transition-colors"
      >
        <Plus size={12} /> Add Entry
      </Link>
    </div>
    <div className="flex-1 space-y-2 overflow-y-auto">
      {entries.map((e, i) => {
        const Icon = icons[e.cat];
        return (
          <div
            key={i}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors"
            style={{ animation: `slide-in-left 0.4s ease-out ${i * 0.08}s both` }}
          >
            <span className="font-mono text-[10px] text-muted-foreground/50 w-16 flex-shrink-0">{e.time}</span>
            <Icon size={14} style={{ color: colors[e.cat] }} className="flex-shrink-0" />
            <span className="text-xs text-foreground/70 flex-1 truncate">{e.desc}</span>
            <span className="font-mono text-xs text-foreground">{e.co2} kg</span>
            <span className={`text-xs ${e.trend === "down" ? "text-primary" : e.trend === "up" ? "text-destructive" : "text-muted-foreground"}`}>
              {e.trend === "down" ? "▼" : e.trend === "up" ? "▲" : "—"}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

export default LogTimeline;
