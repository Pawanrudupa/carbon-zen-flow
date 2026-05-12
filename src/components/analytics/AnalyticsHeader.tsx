import { useMemo } from "react";

const ranges = ["This Month", "Last 3 Months", "This Year", "All Time"];

interface AnalyticsHeaderProps {
  dateRange: string;
  setDateRange: (r: string) => void;
  entries: Array<{
    logged_at: string;
    co2_kg: number;
    [key: string]: unknown;
  }>;
}

const AnalyticsHeader = ({ dateRange, setDateRange, entries }: AnalyticsHeaderProps) => {
  const { totalTracked, bestMonthStr, avgPerDay, monthsLogged } = useMemo(() => {
    const safeEntries = entries || [];
    const totalTracked = safeEntries.reduce((sum, e) => sum + (e.co2_kg || 0), 0);

    // Group by month to find best month and months logged
    const byMonth = safeEntries.reduce((acc: Record<string, number>, e) => {
      if (!e.logged_at) return acc;
      const d = new Date(e.logged_at);
      if (isNaN(d.getTime())) return acc;
      
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      acc[key] = (acc[key] || 0) + (e.co2_kg || 0);
      return acc;
    }, {});

    const monthsLogged = Object.keys(byMonth).length;

    let bestMonthStr = "None";
    if (monthsLogged > 0) {
      const sortedMonths = Object.entries(byMonth).sort((a, b) => a[1] - b[1]); 
      const best = sortedMonths[sortedMonths.length - 1];
      if (best) {
        const [y, m] = best[0].split("-");
        const d = new Date(parseInt(y), parseInt(m), 1);
        if (!isNaN(d.getTime())) {
          bestMonthStr = `${d.toLocaleString("en-US", { month: "short" })} · ${Math.round(best[1])} kg`;
        }
      }
    }

    // Avg per day
    const uniqueDays = new Set(
      safeEntries
        .map(e => (e.logged_at ? e.logged_at.substring(0, 10) : ""))
        .filter(Boolean)
    ).size;
    
    const avgPerDay = uniqueDays > 0 ? (totalTracked / uniqueDays) : 0;

    return { totalTracked, bestMonthStr, avgPerDay, monthsLogged };
  }, [entries]);

  const stats = [
    { label: "Total tracked", value: `${Math.round(totalTracked)} kg CO₂`, bars: [60, 80, 45, 70] },
    { label: "Best month", value: bestMonthStr, bars: [90, 40, 30, 55] },
    { label: "Avg per day", value: `${avgPerDay.toFixed(1)} kg`, bars: [50, 65, 55, 48] },
    { label: "Months logged", value: `${monthsLogged} months`, bars: [30, 50, 70, 90] },
  ];

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
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${dateRange === r
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
