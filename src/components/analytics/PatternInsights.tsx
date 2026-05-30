import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";

interface PatternInsightsProps {
  entries: any[];
}

const PatternInsights = ({ entries }: PatternInsightsProps) => {
  const [biggestWin, setBiggestWin] = useState({ title: "Analyzing data...", savedKg: 0, equivalentKm: 0, dateString: "" });
  const [forecastState, setForecastState] = useState({ projectedKg: 0, targetKg: 350, overUnder: 0, isOver: false });

  useEffect(() => {
    try {
      if (!entries || entries.length < 7) {
        setBiggestWin({ title: "Keep tracking to unlock your biggest wins!", savedKg: 0, equivalentKm: 0, dateString: "" });
        // Calculate basic forecast even with few entries
      }

      // A. Forecast Logic
      const now = new Date();
      let currentMonthSum = 0;
      entries?.forEach(e => {
        const d = new Date(e.logged_at);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          currentMonthSum += e.co2_kg;
        }
      });
      const daysPassed = now.getDate() || 1;
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const runRate = currentMonthSum / daysPassed;
      const projectedKg = Math.round(runRate * daysInMonth);
      const targetKg = 350;
      const overUnder = Math.abs(projectedKg - targetKg);
      const isOver = projectedKg > targetKg;
      
      setForecastState({ projectedKg, targetKg, overUnder, isOver });

      // B. Biggest Single Win Logic
      if (entries && entries.length >= 7) {
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

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate() || 1;
    const target = 350;
    const forecast = currentMonthSum > 0 ? Math.round((currentMonthSum / daysPassed) * daysInMonth) : 0;
    const diff = target - forecast;

    return {
      weekdayData: reordered,
      maxAvg,
      bestDay,
      minAvg,
      currentMonthSum,
      forecast,
      diff,
      target
    };
  }, [entries]);

  const { weekdayData, maxAvg, bestDay, minAvg, forecast, diff, target } = insights;
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
          <div>
            <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[0.15em] mb-3">Forecast</p>
            <p className="text-sm text-foreground/80 leading-relaxed">
              At your current pace you'll finish this month at{" "}
              <span className={`font-mono font-semibold ${forecastState.isOver ? 'text-destructive' : 'text-primary'}`}>{forecastState.projectedKg} kg</span> —{" "}
              <span className={`font-mono font-semibold ${forecastState.isOver ? 'text-destructive' : 'text-primary'}`}>{forecastState.overUnder} kg</span> {forecastState.isOver ? "over" : "under"} target. {!forecastState.isOver ? "Keep it up." : "Time to cut back."}
            </p>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${forecastState.isOver ? 'bg-destructive' : 'bg-primary'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((forecastState.projectedKg / forecastState.targetKg) * 100, 100)}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] font-mono text-muted-foreground/40">0 kg</span>
              <span className={`text-[9px] font-mono ${forecastState.isOver ? 'text-destructive/60' : 'text-primary/60'}`}>{forecastState.projectedKg} / {forecastState.targetKg} kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternInsights;
