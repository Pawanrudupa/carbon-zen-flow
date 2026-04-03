import { useState } from "react";

const ranges = ["This Month", "Last 3 Months", "This Year", "All Time"];

const stats = [
  { label: "Total tracked", value: "1,847 kg CO₂", bars: [60, 80, 45, 70] },
  { label: "Best month", value: "Feb · 268 kg", bars: [90, 40, 30, 55] },
  { label: "Avg per day", value: "10.4 kg", bars: [50, 65, 55, 48] },
  { label: "Months logged", value: "6 months", bars: [30, 50, 70, 90] },
];

const AnalyticsHeader = () => {
  const [selected, setSelected] = useState("Last 3 Months");

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-[32px] font-bold text-foreground leading-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Your complete carbon history and patterns</p>
        </div>
        <div className="flex gap-1.5">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setSelected(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
                selected === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="glass-card rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[0.15em]">{s.label}</p>
              <p className="font-mono text-lg text-foreground mt-1">{s.value}</p>
            </div>
            <div className="flex items-end gap-[3px] h-8">
              {s.bars.map((h, i) => (
                <div
                  key={i}
                  className="w-[5px] rounded-sm bg-primary/40"
                  style={{ height: `${(h / 100) * 28}px` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsHeader;
