import { motion } from "framer-motion";
import { BarChart3, Target, Brain, HelpCircle } from "lucide-react";

const problems = [
  {
    icon: BarChart3,
    title: "Generic trackers give you a useless annual number",
    desc: "A single yearly estimate tells you nothing about what to change today.",
  },
  {
    icon: Target,
    title: "No one tells you which specific habits are costing the planet",
    desc: "You need granular, daily data — not vague categories.",
  },
  {
    icon: Brain,
    title: "Guilt-based apps make you quit in week two",
    desc: "Motivation through shame doesn't work. Intelligence does.",
  },
];

const ProblemSection = () => (
  <section className="py-24 px-4">
    <div className="max-w-6xl mx-auto">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-heading font-700 text-3xl md:text-4xl text-foreground text-center max-w-3xl mx-auto"
      >
        Most people have no idea what their carbon footprint{" "}
        <span className="text-destructive">actually looks like.</span>
      </motion.h2>
      <div className="mt-16 grid md:grid-cols-3 gap-6">
        {problems.filter(Boolean).map((p, i) => {
          const IconComponent = p?.icon || HelpCircle;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card rounded-xl p-6 border-destructive/20 hover:border-destructive/30"
              style={{ borderColor: "rgba(248,113,113,0.15)" }}
            >
              <IconComponent className="text-destructive mb-4" size={28} />
              <h3 className="font-heading font-600 text-foreground text-lg mb-2">{p?.title || "Problem"}</h3>
              <p className="text-muted-foreground text-sm">{p?.desc || ""}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);

export default ProblemSection;
