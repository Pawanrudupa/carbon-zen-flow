import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const features = [
  "Daily granularity",
  "AI insights",
  "Gamification",
  "Beautiful UI",
  "Household mode",
  "Free tier",
];

const columns = [
  { name: "CarbonLedger", vals: [true, true, true, true, true, true] },
  { name: "Generic Apps", vals: [false, false, true, false, false, true] },
  { name: "Spreadsheets", vals: [true, false, false, false, false, true] },
];

const ComparisonSection = () => (
  <section className="py-24 px-4">
    <div className="max-w-4xl mx-auto">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-heading font-700 text-3xl md:text-4xl text-foreground text-center mb-16"
      >
        Finally, a tracker that respects your <span className="text-gradient-green">intelligence.</span>
      </motion.h2>
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 text-sm">
          <div className="p-4 font-heading font-600 text-muted-foreground border-b border-primary/10">Feature</div>
          {columns.map((c, i) => (
            <div
              key={c.name}
              className={`p-4 font-heading font-600 text-center border-b border-primary/10 ${
                i === 0 ? "text-primary glow-border" : "text-muted-foreground"
              }`}
            >
              {c.name}
            </div>
          ))}
          {features.map((f, fi) => (
            <div key={`row-${fi}`} className="contents">
              <div className="p-4 text-foreground/80 border-b border-primary/5 text-sm font-body">
                {f}
              </div>
              {columns.map((c, ci) => (
                <div
                  key={`${fi}-${ci}`}
                  className={`p-4 flex items-center justify-center border-b border-primary/5 ${
                    ci === 0 ? "bg-primary/5" : ""
                  }`}
                >
                  {c.vals[fi] ? (
                    <Check className="text-primary" size={18} />
                  ) : (
                    <X className="text-destructive/50" size={18} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default ComparisonSection;
