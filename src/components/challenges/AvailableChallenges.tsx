import { useState } from "react";
import { motion } from "framer-motion";
import { Plane, Salad, Droplets, Recycle, Footprints, Trash2, Search } from "lucide-react";

const filters = ["All", "Food", "Transport", "Energy", "Shopping", "Lifestyle"];

const challenges = [
  {
    title: "No-fly month",
    icon: Plane,
    category: "Transport",
    catColor: "bg-[hsl(var(--chart-blue))]/15 text-[hsl(var(--chart-blue))]",
    iconBg: "bg-[hsl(var(--chart-blue))]/20",
    iconColor: "text-[hsl(var(--chart-blue))]",
    description: "Skip all flights for 30 days",
    saving: "-180 kg",
    difficulty: "Hard",
    diffDot: "🔴",
  },
  {
    title: "Plant-based week",
    icon: Salad,
    category: "Food",
    catColor: "bg-primary/15 text-primary",
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
    description: "Eat fully plant-based for 7 days",
    saving: "-22 kg",
    difficulty: "Medium",
    diffDot: "🟡",
  },
  {
    title: "Cold shower week",
    icon: Droplets,
    category: "Energy",
    catColor: "bg-[hsl(var(--chart-amber))]/15 text-[hsl(var(--chart-amber))]",
    iconBg: "bg-[hsl(var(--chart-amber))]/20",
    iconColor: "text-[hsl(var(--chart-amber))]",
    description: "Cold showers only for 7 days",
    saving: "-4 kg",
    difficulty: "Medium",
    diffDot: "🟡",
  },
  {
    title: "Second-hand only",
    icon: Recycle,
    category: "Shopping",
    catColor: "bg-[hsl(var(--chart-purple))]/15 text-[hsl(var(--chart-purple))]",
    iconBg: "bg-[hsl(var(--chart-purple))]/20",
    iconColor: "text-[hsl(var(--chart-purple))]",
    description: "Only buy second-hand items this month",
    saving: "-40 kg",
    difficulty: "Easy",
    diffDot: "🟢",
  },
  {
    title: "Walk 10k steps daily",
    icon: Footprints,
    category: "Lifestyle",
    catColor: "bg-[hsl(var(--chart-teal))]/15 text-[hsl(var(--chart-teal))]",
    iconBg: "bg-[hsl(var(--chart-teal))]/20",
    iconColor: "text-[hsl(var(--chart-teal))]",
    description: "Walk 10,000 steps every day for 2 weeks",
    saving: "-15 kg",
    difficulty: "Easy",
    diffDot: "🟢",
  },
  {
    title: "Zero waste week",
    icon: Trash2,
    category: "Lifestyle",
    catColor: "bg-[hsl(var(--chart-teal))]/15 text-[hsl(var(--chart-teal))]",
    iconBg: "bg-[hsl(var(--chart-teal))]/20",
    iconColor: "text-[hsl(var(--chart-teal))]",
    description: "Produce zero landfill waste for 7 days",
    saving: "-8 kg",
    difficulty: "Hard",
    diffDot: "🔴",
  },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const AvailableChallenges = () => {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = challenges.filter((c) => {
    const matchCat = activeFilter === "All" || c.category === activeFilter;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
        Start a new challenge
      </h3>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search challenges..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted/20 text-sm font-mono text-foreground placeholder:text-muted-foreground/30 border border-primary/10 focus:border-primary/30 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
                activeFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {filtered.map((c) => (
          <motion.div
            key={c.title}
            variants={fadeUp}
            className="glass-card rounded-xl p-4 flex flex-col"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-9 h-9 rounded-full ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
                <c.icon size={16} className={c.iconColor} />
              </div>
              <div className="min-w-0">
                <h4 className="font-heading text-sm font-semibold text-foreground">{c.title}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono ${c.catColor}`}>
                    {c.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">
                    {c.diffDot} {c.difficulty}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground/70 mb-3 flex-1">{c.description}</p>

            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[hsl(var(--chart-amber))]">{c.saving}</span>
              <button className="px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-[11px] font-mono hover:bg-primary hover:text-primary-foreground transition-all">
                Start Challenge
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default AvailableChallenges;
