import { useState, useRef } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Bot } from "lucide-react";

const insights = [
  {
    type: "PATTERN",
    text: "Weekend food emissions are 2.3× higher than weekdays. Try meal prepping Sundays.",
    color: "text-chart-amber",
    bg: "bg-chart-amber/10",
  },
  {
    type: "ACTION",
    text: "Switch 2 car trips to transit this week to save ~4.2 kg CO₂.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    type: "FORECAST",
    text: "On track to finish at 340 kg — 15% under target.",
    color: "text-info",
    bg: "bg-info/10",
  },
];

const mockResponses: Record<string, string> = {
  "biggest source":
    "🚗 **Transport** is your biggest source at **42%** of total emissions (143 kg this month). Daily car commutes account for 78% of that. Switching to public transit even 2 days/week could cut transport emissions by ~35%.",
  "reduce transport":
    "Here are 3 high-impact moves:\n\n1. **Bike or walk** trips under 3 km — saves ~1.2 kg CO₂/trip\n2. **Carpool** on your commute — cuts per-person emissions by 50%\n3. **Batch errands** into one trip instead of multiple short drives\n\nEstimated savings: **18–25 kg CO₂/month**.",
  "food":
    "🥩 **Meat & dairy** make up 68% of your food footprint. Your weekend dining-out pattern spikes emissions 2.3× above weekday levels. Try one plant-based day per week — that alone saves ~8 kg CO₂/month.",
  "energy":
    "⚡ Your home energy sits at **87 kWh/week**, slightly above average. Heating is the top driver (61%). Lowering your thermostat by 2°C could save ~12% on energy emissions and ~€15/month.",
  "shopping":
    "🛍️ Last month you logged 6 new-item purchases. Buying **pre-owned** reduces per-item emissions by ~70%. Your best swap: that new jacket (12.4 kg CO₂) could have been 3.7 kg secondhand.",
  "target":
    "📊 You're currently at **285 kg** with 12 days left — pacing at **340 kg** for the month. Your target is 400 kg, so you're **15% under target**. Keep it up!",
  "tips":
    "Top 3 quick wins this week:\n\n1. 🚌 Take transit Tuesday & Thursday → save 4.2 kg\n2. 🥗 Swap 2 meat meals for plant-based → save 3.1 kg\n3. 🔌 Unplug standby devices overnight → save 0.8 kg\n\n**Total potential: ~8 kg CO₂ saved.**",
};

const findResponse = (query: string): string => {
  const q = query.toLowerCase();
  for (const [key, response] of Object.entries(mockResponses)) {
    if (q.includes(key)) return response;
  }
  return `Based on your data, your monthly average is **340 kg CO₂**. Transport (42%) and food (31%) are your primary contributors. Would you like specific tips for either category?`;
};

const cardVariant = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

const AIInsightPanel = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !query.trim()) return;
    const userMsg = query.trim();
    setQuery("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "ai", text: findResponse(userMsg) }]);
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    }, 800 + Math.random() * 600);
  };

  return (
    <div className="glass-card rounded-xl p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="text-primary" size={14} />
        </motion.div>
        <h3 className="font-heading font-600 text-foreground/80 text-xs">AI Insights</h3>
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-primary ml-auto"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        {insights.map((ins, i) => (
          <motion.div
            key={i}
            className="glass-card rounded-lg p-4 group hover:border-primary/20 transition-colors"
            variants={cardVariant}
            initial="hidden"
            animate="show"
            custom={i}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <span className={`font-mono text-[9px] uppercase tracking-[0.15em] ${ins.color} ${ins.bg} px-1.5 py-0.5 rounded`}>
              {ins.type}
            </span>
            <p className="text-foreground/60 text-[11px] mt-2 leading-relaxed">{ins.text}</p>
          </motion.div>
        ))}
      </div>

      {/* Chat thread */}
      <AnimatePresence>
        {messages.length > 0 && (
          <motion.div
            ref={scrollRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mb-3 max-h-48 overflow-y-auto space-y-2 scrollbar-thin"
          >
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot size={10} className="text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-3 py-2 text-[11px] leading-relaxed max-w-[80%] whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-primary/15 text-foreground/80"
                      : "bg-muted/30 text-foreground/70 border border-primary/5"
                  }`}
                >
                  {msg.text.replace(/\*\*(.*?)\*\*/g, "$1")}
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                  <Bot size={10} className="text-primary" />
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <motion.div
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-primary/40"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleSubmit}
        placeholder="Ask your data anything…"
        className="w-full px-3 py-2 rounded-lg bg-input border border-primary/10 text-foreground text-[11px] placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-colors"
      />
    </div>
  );
};

export default AIInsightPanel;
