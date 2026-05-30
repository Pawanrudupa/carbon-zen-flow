import { motion } from "framer-motion";
import { PenLine, BarChart2, Lightbulb, HelpCircle } from "lucide-react";

const steps = [
  { num: "01", icon: PenLine, title: "Log your day", desc: "Food, travel, energy in under 60 seconds." },
  { num: "02", icon: BarChart2, title: "See your patterns", desc: "Beautiful charts reveal hidden habits." },
  { num: "03", icon: Lightbulb, title: "Take action", desc: "AI tells you exactly what to change this week." },
];

const HowItWorksSection = () => (
  <section className="py-24 px-4">
    <div className="max-w-6xl mx-auto">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-heading font-700 text-3xl md:text-4xl text-foreground text-center"
      >
        Three steps. <span className="text-gradient-green">Real impact.</span>
      </motion.h2>
      <div className="mt-16 grid md:grid-cols-3 gap-8">
        {steps.filter(Boolean).map((s, i) => {
          const IconComponent = s?.icon || HelpCircle;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative glass-card rounded-xl p-8 text-center"
            >
              <span className="absolute top-4 left-4 font-heading font-800 text-6xl text-primary/10">
                {s?.num || ""}
              </span>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="text-primary" size={24} />
                </div>
                <h3 className="font-heading font-600 text-foreground text-xl mb-2">{s?.title || "Step"}</h3>
                <p className="text-muted-foreground text-sm">{s?.desc || ""}</p>
              </div>
              {i < 2 && (
                <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 text-primary/30 text-2xl z-20">
                  →
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
