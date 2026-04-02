import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Priya S.", location: "Bangalore", quote: "CarbonLedger made me realize my daily commute was 3x worse than I thought. Changed to train, saved 41 kg in a month.", reduction: "-41 kg", stars: 5 },
  { name: "Marco L.", location: "Berlin", quote: "The AI insights are mind-blowing. It caught a pattern I never would have noticed — my weekend cooking was my biggest emission source.", reduction: "-88 kg", stars: 5 },
  { name: "Aisha K.", location: "Nairobi", quote: "Finally, an app that doesn't guilt-trip me. The challenges keep me motivated and the data is beautiful.", reduction: "-62 kg", stars: 5 },
];

const TestimonialsSection = () => (
  <section className="py-24 px-4">
    <div className="max-w-6xl mx-auto">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-heading font-700 text-3xl md:text-4xl text-foreground text-center mb-16"
      >
        Real people. <span className="text-gradient-green">Real reductions.</span>
      </motion.h2>
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="glass-card rounded-xl p-6"
          >
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: t.stars }).map((_, si) => (
                <Star key={si} className="text-chart-amber fill-chart-amber" size={14} />
              ))}
            </div>
            <p className="text-foreground/80 text-sm mb-4 italic font-body">"{t.quote}"</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-heading font-600 text-sm">{t.name}</p>
                <p className="text-muted-foreground text-xs">{t.location}</p>
              </div>
              <span className="font-mono text-primary font-bold text-lg">{t.reduction}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
