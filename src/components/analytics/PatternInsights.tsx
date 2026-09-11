import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { ForecastResult } from "@/utils/mlModel";

interface PatternInsightsProps {
  entries: any[];
}

// Module-level cache for the dynamically imported ML model
let cachedMlModule: typeof import("@/utils/mlModel") | null = null;
let mlModulePromise: Promise<typeof import("@/utils/mlModel")> | null = null;

function getMlModel(): Promise<typeof import("@/utils/mlModel")> {
  if (cachedMlModule) return Promise.resolve(cachedMlModule);
  if (!mlModulePromise) {
    mlModulePromise = import("@/utils/mlModel")
      .then((mod) => {
        cachedMlModule = mod;
        return mod;
      })
      .catch((err) => {
        mlModulePromise = null;
        throw err;
      });
  }
  return mlModulePromise;
}

const PatternInsights = ({ entries }: PatternInsightsProps) => {
  const [biggestWin, setBiggestWin] = useState({ title: "Analyzing data...", savedKg: 0, equivalentKm: 0, dateString: "" });
  const [mlModule, setMlModule] = useState<typeof import("@/utils/mlModel") | null>(() => cachedMlModule);
  const [loadingModel, setLoadingModel] = useState(() => !cachedMlModule);
  const [moduleLoadFailed, setModuleLoadFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!cachedMlModule) {
      setLoadingModel(true);
      getMlModel()
        .then((mod) => {
          if (mounted) {
            setMlModule(mod);
            setLoadingModel(false);
            setModuleLoadFailed(false);
          }
        })
        .catch((err) => {
          console.error("Failed to load ML model chunk:", err);
          mlModulePromise = null;
          if (mounted) {
            setLoadingModel(false);
            setModuleLoadFailed(true);
          }
        });
    } else {
      setMlModule(cachedMlModule);
      setLoadingModel(false);
      setModuleLoadFailed(false);
    }
    return () => {
      mounted = false;
    };
  }, []);

  // Build daily totals array for ML linear regression
  const forecast = useMemo((): ForecastResult => {
    const defaultForecast: ForecastResult = {
      projectedMonthTotal: 0,
      targetKg: 350,
      daysRemaining: 0,
      slope: 0,
      intercept: 0,
      r2: 0,
      onTrack: true,
      recommendation: "Log more entries to get an accurate forecast.",
      method: "average",
    };

    if (!entries || entries.length === 0) {
      if (mlModule) {
        return mlModule.forecastMonthEnd([], 350, 0);
      }
      return defaultForecast;
    }
    const now = new Date();
    const dailyMap: Record<number, number> = {};
    entries.forEach((e) => {
      const d = new Date(e.logged_at);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        const day = d.getDate();
        dailyMap[day] = (dailyMap[day] || 0) + e.co2_kg;
      }
    });

    const dailyTotals = Object.entries(dailyMap).map(([day, co2]) => ({
      day: parseInt(day),
      co2,
    }));
    const daysWithData = dailyTotals.length;

    if (mlModule) {
      return mlModule.forecastMonthEnd(dailyTotals, 350, daysWithData);
    }

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = Math.max(1, now.getDate());
    const currentTotal = dailyTotals.reduce((s, d) => s + d.co2, 0);
    const projected = Math.round((currentTotal / daysPassed) * daysInMonth);
    return {
      ...defaultForecast,
      projectedMonthTotal: projected,
      daysRemaining: Math.max(0, daysInMonth - daysPassed),
      onTrack: projected <= 350,
    };
  }, [entries, mlModule]);

  useEffect(() => {
    try {
      if (!entries || entries.length === 0) {
        return;
      }

      if (entries.length < 7) {
        setBiggestWin({ title: "Keep tracking to unlock your biggest wins!", savedKg: 0, equivalentKm: 0, dateString: "" });
      }

      // B. Biggest Single Win Logic
      if (entries.length >= 7) {
        const sorted = [...entries].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
        const firstDate = new Date(sorted[0].logged_at);
        const lastDate = new Date(sorted[sorted.length - 1].logged_at);
        const totalDays = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24));
        const totalWeeks = totalDays / 7;
        const totalEmissions = sorted.reduce((sum, e) => sum + e.co2_kg, 0);
        const overallWeeklyAverage = totalWeeks > 0 ? totalEmissions / totalWeeks : totalEmissions;

        let bestWeekTotal = Infinity;
        let bestWeekStart = firstDate;
        let bestWeekCategory = "General";

        for (let i = 0; i < sorted.length; i++) {
          const start = new Date(sorted[i].logged_at);
          const end = new Date(start.getTime() + 7 * 24 * 3600 * 1000);
          const weekEntries = sorted.filter(e => {
            const d = new Date(e.logged_at);
            return d >= start && d < end;
          });
          
          const weekTotal = weekEntries.reduce((sum, e) => sum + e.co2_kg, 0);
          if (weekTotal < bestWeekTotal && weekEntries.length > 0) {
            bestWeekTotal = weekTotal;
            bestWeekStart = start;
            const cats = weekEntries.reduce((acc, e) => {
              acc[e.category] = (acc[e.category] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            bestWeekCategory = Object.keys(cats).sort((a, b) => cats[b] - cats[a])[0] || "General";
          }
        }

        const savedKg = Math.max(0, Math.round(overallWeeklyAverage - bestWeekTotal));
        const equivalentKm = Math.round(savedKg * 4.8);
        const endOfWeek = new Date(bestWeekStart.getTime() + 6 * 24 * 3600 * 1000);
        const dateString = `${bestWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

        if (savedKg > 0) {
          setBiggestWin({
            title: `${bestWeekCategory} week`,
            savedKg,
            equivalentKm,
            dateString
          });
        } else {
          setBiggestWin({ title: "Keep tracking to unlock your biggest wins!", savedKg: 0, equivalentKm: 0, dateString: "" });
        }
      }
    } catch (e) {
      console.error("Error calculating dynamic insights:", e);
      setBiggestWin({ title: "Keep tracking to unlock your biggest wins!", savedKg: 0, equivalentKm: 0, dateString: "" });
    }
  }, [entries]);

  const insights = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const sums = Array(7).fill(0);
    const counts = Array(7).fill(0);

    let currentMonthSum = 0;
    const now = new Date();

    if (!entries || entries.length === 0) {
      return {
        weekdayData: days.map(day => ({ day, avg: 0 })),
        maxAvg: 1,
        bestDay: "N/A",
        minAvg: 0,
      };
    }

    entries.forEach((e) => {
      const d = new Date(e.logged_at);
      const dow = d.getDay();
      sums[dow] += e.co2_kg;
      counts[dow] += 1;

      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        currentMonthSum += e.co2_kg;
      }
    });

    const weekdayData = days.map((day, i) => ({
      day,
      avg: counts[i] > 0 ? parseFloat((sums[i] / counts[i]).toFixed(1)) : 0,
    }));

    const reordered = [
      weekdayData[1], weekdayData[2], weekdayData[3], weekdayData[4],
      weekdayData[5], weekdayData[6], weekdayData[0]
    ];

    const maxAvg = Math.max(...reordered.map((d) => d.avg), 1);
    const validAvgs = reordered.filter((d) => d.avg > 0).map((d) => d.avg);
    const minAvg = validAvgs.length > 0 ? Math.min(...validAvgs) : 0;
    const bestDay = reordered.find((d) => d.avg === minAvg && d.avg > 0)?.day || "N/A";

    return {
      weekdayData: reordered,
      maxAvg,
      bestDay,
      minAvg,
    };
  }, [entries]);

  const { weekdayData, maxAvg, bestDay, minAvg } = insights;

  if (!entries || entries.length === 0) {
    return (
      <div>
        <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
          Pattern analysis
        </h3>
        <div className="glass-card rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[220px]">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary animate-pulse">
            <span className="text-xl">📊</span>
          </div>
          <h4 className="text-sm font-semibold text-foreground/90 mb-1">
            Log your first entry to see your forecast!
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            We will project your month-end emissions, highlight your biggest weekly wins, and analyze your greenest days once you record your first activity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
        Pattern analysis
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1 — Best day */}
        <div className="glass-card rounded-xl p-5">
          <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[0.15em] mb-3">Best day of the week</p>
          <div className="flex flex-col gap-1.5">
            {weekdayData.map((d) => (
              <div key={d.day} className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground w-7">{d.day}</span>
                <div className="flex-1 h-3 bg-muted/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: d.avg === minAvg && minAvg > 0 ? "#22C55E" : "hsl(142 71% 45% / 0.3)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.avg / maxAvg) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  />
                </div>
                <span className="text-[10px] font-mono text-foreground/60 w-8 text-right">{d.avg}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-primary/60 mt-2 font-mono">{bestDay} is your greenest day</p>
        </div>

        {/* Card 2 — Biggest win */}
        <div className="glass-card rounded-xl p-5 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[0.15em] mb-3">Biggest single win</p>
            {biggestWin.savedKg > 0 ? (
              <p className="text-sm text-foreground/80 leading-relaxed">
                {biggestWin.title} saved <span className="font-mono text-primary font-semibold">{biggestWin.savedKg} kg</span> vs your average.
                That's equivalent to not driving <span className="font-mono text-primary font-semibold">{biggestWin.equivalentKm} km</span>.
              </p>
            ) : (
              <p className="text-sm text-foreground/80 leading-relaxed">{biggestWin.title}</p>
            )}
          </div>
          {biggestWin.dateString && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <span className="text-[10px] font-mono text-muted-foreground/40">{biggestWin.dateString}</span>
            </div>
          )}
        </div>

        {/* Card 3 — Forecast */}
        <div className="glass-card rounded-xl p-5 flex flex-col justify-between">
          {moduleLoadFailed ? (
            <div className="flex flex-col items-center justify-center py-6 my-auto text-center space-y-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <span className="text-sm">⚠</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed px-2">
                A new version of this app is available. Please refresh the page to continue.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-3.5 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-foreground text-xs font-mono font-medium transition-colors"
              >
                Refresh
              </button>
            </div>
          ) : loadingModel || !mlModule ? (
            <div className="flex flex-col items-center justify-center py-10 my-auto text-center">
              <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-3" />
              <p className="text-xs font-mono text-muted-foreground animate-pulse">Calculating forecast…</p>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[0.15em]">
                    {forecast.method === "average" ? "Early Estimate" : "ML Forecast"}
                  </p>
                  {forecast.method === "regression" && (
                    <span className="text-[9px] font-mono text-primary/40">
                      Linear Regression · R²={forecast.r2.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {forecast.recommendation}
                </p>
                {forecast.method === "regression" && forecast.slope !== 0 && (
                  <p className="text-[10px] font-mono text-muted-foreground/50 mt-2">
                    Trend: {forecast.slope > 0 ? "+" : ""}{forecast.slope} kg/day
                    {forecast.slope > 0
                      ? " (emissions increasing ⚠)"
                      : " (emissions decreasing ✓)"}
                  </p>
                )}
              </div>
              <div className="mt-4">
                <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${forecast.onTrack ? "bg-primary" : "bg-destructive"}`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min((forecast.projectedMonthTotal / forecast.targetKg) * 100, 100)}%`
                    }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] font-mono text-muted-foreground/40">0 kg</span>
                  <span className={`text-[9px] font-mono ${forecast.onTrack ? "text-primary/60" : "text-destructive/60"}`}>
                    {forecast.projectedMonthTotal} / {forecast.targetKg} kg
                  </span>
                </div>
                <p className="text-[9px] font-mono text-muted-foreground/30 mt-1 text-center">
                  {forecast.method === "regression"
                    ? `Powered by GradientBoostingRegressor · ${mlModule?.MODEL_META.r2_score ?? 0.995} R²`
                    : "Simple average projection (switches to ML at 5+ days)"}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatternInsights;
