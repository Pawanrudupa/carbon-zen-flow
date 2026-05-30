import { motion } from "framer-motion";
import { Calendar, Brain, Flame, Users, HelpCircle } from "lucide-react";

const features = [
  { icon: Calendar, title: "Daily granularity", desc: "Track food, travel, energy, shopping per day — not per year." },
  { icon: Brain, title: "AI insight engine", desc: "AI-powered weekly pattern analysis reveals hidden habits." },
  { icon: Flame, title: "Challenges & streaks", desc: "Gamified reduction goals keep you motivated and on track." },
  { icon: Users, title: "Household mode", desc: "Share a ledger with family and track collective impact." },
];

const SolutionSection = () => (
  <section className="py-24 px-4">
    <div className="max-w-6xl mx-auto">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-heading font-700 text-3xl md:text-4xl text-foreground text-center"
      >
        CarbonLedger is <span className="text-gradient-green">different.</span>
      </motion.h2>
      <div className="mt-16 flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
        {features.filter(Boolean).map((f, i) => {
          const IconComponent = f?.icon || HelpCircle;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-6 min-w-[280px] flex-shrink-0 snap-center"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <IconComponent className="text-primary" size={24} />
              </div>
              <h3 className="font-heading font-600 text-foreground text-lg mb-2">{f?.title || "Feature"}</h3>
              <p className="text-muted-foreground text-sm">{f?.desc || ""}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);

export default SolutionSection;
