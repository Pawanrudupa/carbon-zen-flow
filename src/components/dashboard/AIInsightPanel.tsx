import { Sparkles } from "lucide-react";

const insights = [
  {
    type: "PATTERN DETECTED",
    text: "Your weekend food emissions are 2.3x higher than weekdays. Consider meal prepping on Sundays.",
    color: "text-chart-amber",
  },
  {
    type: "WIN THIS WEEK",
    text: "Switch 2 car trips to public transit this week to save ~4.2 kg CO₂.",
    color: "text-primary",
  },
  {
    type: "FORECAST",
    text: "At current pace, you'll finish this month at 340 kg — 15% under your target of 400 kg.",
    color: "text-info",
  },
];

const AIInsightPanel = () => (
  <div className="glass-card rounded-xl p-5 h-full flex flex-col border-primary/20">
    <div className="flex items-center gap-2 mb-4">
      <Sparkles className="text-primary" size={16} />
      <h3 className="font-heading font-600 text-foreground text-sm">AI Intelligence</h3>
      <div className="w-2 h-2 rounded-full bg-primary animate-pulse ml-auto" />
    </div>
    <div className="flex-1 flex flex-col gap-3">
      {insights.map((ins, i) => (
        <div key={i} className="glass-card rounded-lg p-3 flex-1">
          <span className={`font-mono text-[10px] uppercase tracking-wider ${ins.color}`}>
            {ins.type}
          </span>
          <p className="text-foreground/70 text-xs mt-1 leading-relaxed">{ins.text}</p>
        </div>
      ))}
    </div>
    <div className="mt-4">
      <input
        type="text"
        placeholder="Ask your data anything..."
        className="w-full px-3 py-2 rounded-lg bg-input border border-primary/10 text-foreground text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30"
      />
    </div>
  </div>
);

export default AIInsightPanel;
