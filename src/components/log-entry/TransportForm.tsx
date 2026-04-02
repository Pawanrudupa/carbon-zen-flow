import { motion } from "framer-motion";
import { Car, Bus, TrainFront, Plane, Bike, Users } from "lucide-react";

const modes = [
  { key: "car", label: "Car", icon: Car, co2: 0.21, color: "hsl(var(--chart-blue))" },
  { key: "bus", label: "Bus", icon: Bus, co2: 0.089, color: "hsl(var(--chart-teal))" },
  { key: "train", label: "Train", icon: TrainFront, co2: 0.041, color: "hsl(var(--primary))" },
  { key: "flight", label: "Flight", icon: Plane, co2: 0.255, color: "hsl(var(--chart-amber))" },
  { key: "cycle", label: "Bicycle", icon: Bike, co2: 0, color: "hsl(var(--primary))" },
];

interface TransportFormProps {
  formData: Record<string, string>;
  update: (key: string, value: string) => void;
}

const TransportForm = ({ formData, update }: TransportFormProps) => {
  const selectedMode = formData.mode || "car";
  const distance = parseFloat(formData.distance || "0");
  const passengers = parseInt(formData.passengers || "1");
  const modeData = modes.find(m => m.key === selectedMode)!;

  return (
    <div className="space-y-6">
      {/* Mode selector — horizontal vehicle cards */}
      <div>
        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3 block">
          Mode of Transport
        </span>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {modes.map((mode, i) => {
            const active = selectedMode === mode.key;
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => update("mode", mode.key)}
                className={`flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-xl border transition-all duration-300 ${
                  active
                    ? "border-primary/30 bg-primary/10"
                    : "border-primary/5 bg-muted/20 hover:border-primary/15"
                }`}
                style={active ? { boxShadow: `0 0 24px ${mode.color}15` } : {}}
              >
                <Icon size={20} style={{ color: active ? mode.color : "hsl(var(--muted-foreground))" }} />
                <div className="text-left">
                  <span className={`text-sm font-heading font-600 block ${active ? "text-foreground" : "text-muted-foreground"}`}>
                    {mode.label}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground/50">
                    {mode.co2 === 0 ? "Zero emissions" : `${mode.co2} kg/km`}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Route visualizer */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-3 h-3 rounded-full border-2 border-primary" />
            <div className="w-px h-12 bg-gradient-to-b from-primary/60 to-primary/10" />
            <div className="w-3 h-3 rounded-full bg-primary" />
          </div>
          <div className="flex-1 space-y-5">
            <input
              className="w-full px-4 py-2.5 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 font-body transition-colors"
              placeholder="Starting point"
              onChange={(e) => update("from", e.target.value)}
            />
            <input
              className="w-full px-4 py-2.5 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 font-body transition-colors"
              placeholder="Destination"
              onChange={(e) => update("to", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Distance with animated road */}
      <div>
        <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3 block">
          Distance (km)
        </label>
        <div className="relative">
          <input
            type="number"
            step="1"
            value={formData.distance || ""}
            placeholder="0"
            className="w-full px-4 py-3 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 font-mono transition-colors pr-24"
            onChange={(e) => update("distance", e.target.value)}
          />
          {distance > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5"
            >
              <span className="font-mono text-xs px-2 py-1 rounded-md bg-primary/10 text-primary">
                ≈ {((modeData.co2 * distance) / Math.max(passengers, 1)).toFixed(1)} kg
              </span>
            </motion.div>
          )}
        </div>
        {/* Distance comparison */}
        {distance > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 p-3 rounded-lg bg-muted/20 border border-primary/5"
          >
            <span className="text-[11px] text-muted-foreground font-mono">
              {distance < 5 ? "🚶 Walking distance — consider going on foot!" :
               distance < 20 ? "🚲 Great cycling distance!" :
               distance < 100 ? "🚆 Perfect for public transit" :
               distance < 500 ? "✈️ Consider train vs flight" :
               "🌍 Long haul journey"}
            </span>
          </motion.div>
        )}
      </div>

      {/* Passenger counter — stepper UI */}
      <div>
        <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3 block">
          <Users size={12} className="inline mr-1.5" />
          Passengers (shared ride)
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => update("passengers", String(Math.max(1, passengers - 1)))}
            className="w-10 h-10 rounded-lg border border-primary/10 bg-muted/20 text-foreground flex items-center justify-center hover:border-primary/30 transition-colors font-mono text-lg"
          >
            −
          </button>
          <div className="flex gap-1.5">
            {Array.from({ length: Math.min(passengers, 6) }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05, type: "spring" }}
              >
                <Users size={18} className="text-primary" />
              </motion.div>
            ))}
            {passengers > 6 && (
              <span className="font-mono text-sm text-muted-foreground self-center ml-1">+{passengers - 6}</span>
            )}
          </div>
          <span className="font-mono text-lg text-foreground min-w-[2ch] text-center">{passengers}</span>
          <button
            onClick={() => update("passengers", String(passengers + 1))}
            className="w-10 h-10 rounded-lg border border-primary/10 bg-muted/20 text-foreground flex items-center justify-center hover:border-primary/30 transition-colors font-mono text-lg"
          >
            +
          </button>
        </div>
        {passengers > 1 && (
          <span className="text-[10px] text-primary/70 font-mono mt-2 block">
            Emissions split {passengers} ways — great choice!
          </span>
        )}
      </div>
    </div>
  );
};

export default TransportForm;
