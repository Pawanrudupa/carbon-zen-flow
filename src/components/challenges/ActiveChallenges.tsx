import { motion } from "framer-motion";
import { Leaf, Bike, Power } from "lucide-react";

const activeChallenges = [
  {
    title: "Meatless Weekdays",
    icon: Leaf,
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
    category: "Food",
    catColor: "bg-primary/15 text-primary",
    description: "Avoid meat Monday–Friday for one full week",
    progress: 71,
    progressColor: "bg-primary",
    progressDetail: "3 days done · 2 days left · Ends in 2 days",
    saving: "-8.4 kg when complete",
    status: "On Track",
    statusColor: "bg-primary/15 text-primary",
  },
  {
    title: "Cycle Commute",
    icon: Bike,
    iconBg: "bg-[hsl(var(--chart-blue))]/20",
    iconColor: "text-[hsl(var(--chart-blue))]",
    category: "Transport",
    catColor: "bg-[hsl(var(--chart-blue))]/15 text-[hsl(var(--chart-blue))]",
    description: "Complete 3 bicycle commutes instead of driving",
    progress: 48,
    progressColor: "bg-[hsl(var(--chart-blue))]",
    progressDetail: "1 done · 2 remaining · Ends in 5 days",
    saving: "-12.6 kg",
    status: "In Progress",
    statusColor: "bg-[hsl(var(--chart-amber))]/15 text-[hsl(var(--chart-amber))]",
  },
  {
    title: "Unplug Everything",
    icon: Power,
    iconBg: "bg-[hsl(var(--chart-amber))]/20",
    iconColor: "text-[hsl(var(--chart-amber))]",
    category: "Energy",
    catColor: "bg-[hsl(var(--chart-amber))]/15 text-[hsl(var(--chart-amber))]",
    description: "Turn off all standby devices before bed for 10 days",
    progress: 25,
    progressColor: "bg-[hsl(var(--chart-amber))]",
    progressDetail: "2 days done · 8 remaining · Ends in 6 days",
    saving: "-3.2 kg",
    status: "Just Started",
    statusColor: "bg-muted/30 text-muted-foreground",
  },
];

const MiniRing = ({ pct, color }: { pct: number; color: string }) => {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
      <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth={3} className="text-muted/20" />
      <motion.circle
        cx="24" cy="24" r={r}
        fill="none" stroke={color} strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 24 24)"
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${circ}` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <text x="24" y="24" textAnchor="middle" dominantBaseline="central"
        className="fill-foreground" style={{ fontSize: 10, fontFamily: "JetBrains Mono" }}>
        {pct}%
      </text>
    </svg>
  );
};

const ringColors: Record<string, string> = {
  "bg-primary": "#22C55E",
  "bg-[hsl(var(--chart-blue))]": "hsl(217 91% 60%)",
  "bg-[hsl(var(--chart-amber))]": "hsl(38 95% 51%)",
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const ActiveChallenges = () => {
  return (
    <div>
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
        Active challenges (3)
      </h3>
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {activeChallenges.map((c) => (
          <motion.div
            key={c.title}
            variants={fadeUp}
            className="glass-card rounded-xl p-5 relative"
          >
            {/* Mini ring top-right */}
            <div className="absolute top-4 right-4">
              <MiniRing pct={c.progress} color={ringColors[c.progressColor] || "#22C55E"} />
            </div>

            <div className="flex items-start gap-3 mb-3 pr-14">
              <div className={`w-10 h-10 rounded-full ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
                <c.icon size={18} className={c.iconColor} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-heading text-sm font-semibold text-foreground">{c.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${c.catColor}`}>
                    {c.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/70">{c.description}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${c.progressColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${c.progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px] font-mono text-muted-foreground/50 mt-1.5">{c.progressDetail}</p>
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="font-mono text-xs text-[hsl(var(--chart-amber))]">{c.saving}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${c.statusColor}`}>
                {c.status}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default ActiveChallenges;
