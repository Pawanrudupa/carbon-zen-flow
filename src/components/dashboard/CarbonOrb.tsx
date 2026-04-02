import CountUp from "./CountUp";

const CarbonOrb = () => {
  const total = 312;
  const target = 400;
  const progress = (total / target) * 100;
  const color = progress < 60 ? "text-primary" : progress < 85 ? "text-chart-amber" : "text-destructive";

  return (
    <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center h-full">
      <span className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest mb-4">
        This Month
      </span>
      <div className="relative w-[240px] h-[240px] md:w-[280px] md:h-[280px] flex items-center justify-center">
        {/* Background glow */}
        <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse-glow" />

        {/* Outer rotating ring */}
        <svg className="absolute inset-0 w-full h-full animate-rotate-ring" viewBox="0 0 300 300">
          <circle
            cx="150" cy="150" r="140"
            fill="none"
            stroke="rgba(34,197,94,0.1)"
            strokeWidth="2"
            strokeDasharray="8 12"
          />
        </svg>

        {/* Progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 300 300">
          <circle
            cx="150" cy="150" r="120"
            fill="none"
            stroke="rgba(34,197,94,0.08)"
            strokeWidth="4"
          />
          <circle
            cx="150" cy="150" r="120"
            fill="none"
            stroke="currentColor"
            className={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(progress / 100) * 754} 754`}
            style={{
              transition: "stroke-dasharray 1.5s ease-out",
            }}
          />
        </svg>

        {/* Inner pulsing ring */}
        <div className="absolute w-[180px] h-[180px] md:w-[210px] md:h-[210px] rounded-full border border-primary/20 animate-breathe" />

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center animate-breathe">
          <CountUp
            end={total}
            className={`font-mono text-4xl md:text-5xl font-bold ${color}`}
            duration={1500}
          />
          <span className="font-mono text-sm text-muted-foreground mt-1">kg CO₂</span>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <span className="px-3 py-1.5 rounded-full glass-card text-xs font-mono text-primary">
          vs last month: -18%
        </span>
        <span className="px-3 py-1.5 rounded-full glass-card text-xs font-mono text-primary">
          vs global avg: -34%
        </span>
      </div>
    </div>
  );
};

export default CarbonOrb;
