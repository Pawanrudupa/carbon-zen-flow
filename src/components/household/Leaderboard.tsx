import { motion } from "framer-motion";

const rankings = [
  { rank: 1, name: "Sam Lee", initials: "SL", color: "hsl(255, 82%, 76%)", kg: 245, delta: -14, medal: "🥇", tint: "rgba(255,215,0,0.06)" },
  { rank: 2, name: "Priya Sharma", initials: "PS", color: "hsl(217, 91%, 60%)", kg: 290, delta: -7, medal: "🥈", tint: "rgba(192,192,192,0.06)" },
  { rank: 3, name: "Alex Chen", initials: "AC", color: "hsl(142, 71%, 45%)", kg: 312, delta: -18, medal: "🥉", tint: "rgba(205,127,50,0.06)" },
];

const maxKg = Math.max(...rankings.map((r) => r.kg));

const Leaderboard = () => {
  return (
    <div>
      <h3 className="font-heading text-lg font-semibold text-foreground mb-4">
        This month's rankings
      </h3>
      <div
        className="rounded-xl border bg-card overflow-hidden"
        style={{ borderColor: "rgba(34,197,94,0.12)" }}
      >
        {rankings.map((r, i) => (
          <div
            key={r.name}
            className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0"
            style={{ borderColor: "rgba(34,197,94,0.06)", backgroundColor: r.tint }}
          >
            {/* Rank */}
            <span className="font-mono text-xl font-bold text-muted-foreground/40 w-8 text-center">
              {String(r.rank).padStart(2, "0")}
            </span>

            {/* Medal */}
            <span className="text-lg">{r.medal}</span>

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{ backgroundColor: `${r.color}22`, color: r.color }}
            >
              {r.initials}
            </div>

            {/* Name */}
            <span className="text-sm text-foreground font-medium w-32 truncate">{r.name}</span>

            {/* Kg */}
            <span className="font-mono text-sm text-foreground w-20">{r.kg} kg</span>

            {/* Delta */}
            <span
              className={`font-mono text-xs w-16 ${r.delta < 0 ? "text-primary" : "text-destructive"}`}
            >
              {r.delta < 0 ? "▼" : "▲"} {Math.abs(r.delta)}%
            </span>

            {/* Bar */}
            <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: r.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(r.kg / maxKg) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.12 }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/60 italic mt-3 text-center">
        Sam is this month's household champion. Everyone improved vs last month.
      </p>
    </div>
  );
};

export default Leaderboard;
