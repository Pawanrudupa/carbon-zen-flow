const challenges = [
  { name: "Meatless Week", progress: 0.71, daysLeft: 2, saving: "8.4 kg" },
  { name: "Cycle Commute", progress: 0.4, daysLeft: 5, saving: "12.6 kg" },
  { name: "Unplug Everything", progress: 0.25, daysLeft: 6, saving: "3.2 kg" },
];

const ChallengesPanel = () => (
  <div className="glass-card rounded-xl p-5 h-full flex flex-col">
    <h3 className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest mb-4">Active Challenges</h3>
    <div className="flex-1 flex flex-col gap-3">
      {challenges.map((c, i) => (
        <div key={i} className="glass-card rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground font-heading font-600">{c.name}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{c.daysLeft}d left</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000"
              style={{
                width: `${c.progress * 100}%`,
                boxShadow: "0 0 8px rgba(34,197,94,0.4)",
                animation: `fade-up 0.6s ease-out ${i * 0.15}s both`,
              }}
            />
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-[10px] text-muted-foreground">
              {Math.round(c.progress * 100)}%
            </span>
            <span className="font-mono text-[10px] text-primary">saves {c.saving}</span>
          </div>
        </div>
      ))}
    </div>
    <button className="mt-3 text-xs text-primary font-heading font-600 hover:text-primary/80 transition-colors">
      View All Challenges →
    </button>
  </div>
);

export default ChallengesPanel;
