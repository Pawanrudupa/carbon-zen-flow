import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";

const PricingSection = () => {
  const [annual, setAnnual] = useState(false);

  const free = ["Basic logging", "Monthly totals", "3 challenges/month"];
  const premium = [
    "AI insights",
    "Full history",
    "Unlimited challenges",
    "Household mode",
    "Export reports",
    "Priority support",
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading font-700 text-3xl md:text-4xl text-foreground text-center mb-4"
        >
          Simple pricing.
        </motion.h2>
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm ${!annual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              annual ? "bg-primary" : "bg-muted"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-foreground absolute top-0.5 transition-transform ${
                annual ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className={`text-sm ${annual ? "text-foreground" : "text-muted-foreground"}`}>
            Annual <span className="text-primary text-xs">(2 months free)</span>
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-xl p-8"
          >
            <h3 className="font-heading font-700 text-xl text-foreground mb-2">Free</h3>
            <p className="font-mono text-3xl text-foreground font-bold mb-6">
              ₹0<span className="text-sm text-muted-foreground font-normal">/mo</span>
            </p>
            <ul className="space-y-3">
              {free.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check size={16} className="text-primary" /> {f}
                </li>
              ))}
            </ul>
            <button className="mt-8 w-full py-3 rounded-lg border border-primary/30 text-primary font-heading font-600 transition-all hover:bg-primary/10">
              Get Started
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-xl p-8 glow-border relative"
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-heading font-600">
              Most Popular
            </span>
            <h3 className="font-heading font-700 text-xl text-foreground mb-2">Premium</h3>
            <p className="font-mono text-3xl text-foreground font-bold mb-6">
              ₹{annual ? "249" : "299"}
              <span className="text-sm text-muted-foreground font-normal">/mo</span>
            </p>
            <ul className="space-y-3">
              {premium.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check size={16} className="text-primary" /> {f}
                </li>
              ))}
            </ul>
            <button className="mt-8 w-full py-3 rounded-lg bg-primary text-primary-foreground font-heading font-600 transition-all hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              Start Premium
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
