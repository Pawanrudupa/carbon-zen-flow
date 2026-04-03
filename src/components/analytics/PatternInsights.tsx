import { motion } from "framer-motion";

const weekdayData = [
  { day: "Mon", avg: 10.2 },
  { day: "Tue", avg: 8.1 },
  { day: "Wed", avg: 9.5 },
  { day: "Thu", avg: 10.8 },
  { day: "Fri", avg: 11.3 },
  { day: "Sat", avg: 13.7 },
  { day: "Sun", avg: 12.1 },
];

const maxAvg = Math.max(...weekdayData.map((d) => d.avg));

const PatternInsights = () => {
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
                    style={{ background: d.avg === Math.min(...weekdayData.map((x) => x.avg)) ? "#22C55E" : "hsl(142 71% 45% / 0.3)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.avg / maxAvg) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  />
                </div>
                <span className="text-[10px] font-mono text-foreground/60 w-8 text-right">{d.avg}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-primary/60 mt-2 font-mono">Tuesday is your greenest day</p>
        </div>

        {/* Card 2 — Biggest win */}
        <div className="glass-card rounded-xl p-5 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[0.15em] mb-3">Biggest single win</p>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Veggie week in Feb saved <span className="font-mono text-primary font-semibold">34 kg</span> vs your average.
              That's equivalent to not driving <span className="font-mono text-primary font-semibold">162 km</span>.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-2xl">🥦</span>
            <span className="text-[10px] font-mono text-muted-foreground/40">Feb 10 – Feb 16</span>
          </div>
        </div>

        {/* Card 3 — Forecast */}
        <div className="glass-card rounded-xl p-5 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[0.15em] mb-3">Forecast</p>
            <p className="text-sm text-foreground/80 leading-relaxed">
              At your current pace you'll finish April at{" "}
              <span className="font-mono text-primary font-semibold">330 kg</span> —{" "}
              <span className="font-mono text-primary font-semibold">20 kg</span> under target. Keep it up.
            </p>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: "78%" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] font-mono text-muted-foreground/40">0 kg</span>
              <span className="text-[9px] font-mono text-primary/60">330 / 350 kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternInsights;
