import { motion } from "framer-motion";
import { Zap, Flame, Thermometer, Leaf } from "lucide-react";
import { useState } from "react";

const energyTypes = [
  { key: "electricity", label: "Electricity", icon: Zap, co2: 0.82, unit: "kWh", color: "hsl(var(--chart-amber))" },
  { key: "gas", label: "Natural Gas", icon: Flame, co2: 2.04, unit: "m³", color: "hsl(var(--chart-blue))" },
  { key: "heating", label: "Heating", icon: Thermometer, co2: 1.5, unit: "kWh", color: "hsl(var(--destructive))" },
];

interface EnergyFormProps {
  formData: Record<string, string>;
  update: (key: string, value: string) => void;
}

const EnergyForm = ({ formData, update }: EnergyFormProps) => {
  const selected = formData.energyType || "electricity";
  const units = parseFloat(formData.units || "0");
  const isGreen = formData.green === "true";
  const typeData = energyTypes.find(t => t.key === selected)!;
  const [hoveredMeter, setHoveredMeter] = useState<number | null>(null);

  // Generate meter bars
  const meterBars = 20;
  const fillLevel = Math.min(units / 50, 1);
  const filledBars = Math.round(fillLevel * meterBars);

  return (
    <div className="space-y-6">
      {/* Energy type selector — big iconic cards */}
      <div>
        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3 block">
          Energy Source
        </span>
        <div className="grid grid-cols-3 gap-3">
          {energyTypes.map((type, i) => {
            const active = selected === type.key;
            const Icon = type.icon;
            return (
              <motion.button
                key={type.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => update("energyType", type.key)}
                className={`relative p-5 rounded-xl border text-center transition-all duration-300 overflow-hidden ${
                  active
                    ? "border-primary/30"
                    : "border-primary/5 bg-muted/20 hover:border-primary/15"
                }`}
              >
                {/* Glow background when active */}
                {active && (
                  <motion.div
                    layoutId="energy-glow"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: `radial-gradient(circle at center, ${type.color}15, transparent 70%)`,
                    }}
                  />
                )}
                <div className="relative z-10">
                  <div
                    className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                    style={{
                      backgroundColor: active ? `${type.color}20` : "hsl(var(--muted))",
                      boxShadow: active ? `0 0 20px ${type.color}30` : "none",
                    }}
                  >
                    <Icon size={22} style={{ color: active ? type.color : "hsl(var(--muted-foreground))" }} />
                  </div>
                  <span className={`text-sm font-heading font-600 block ${active ? "text-foreground" : "text-muted-foreground"}`}>
                    {type.label}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground/50 mt-1 block">
                    {type.co2} kg CO₂/{type.unit}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Power meter visualization */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Power Meter</span>
          <span className="font-mono text-sm text-foreground">
            {units} {typeData.unit}
          </span>
        </div>
        <div className="flex gap-1 items-end h-16">
          {Array.from({ length: meterBars }).map((_, i) => {
            const filled = i < filledBars;
            const isHovered = hoveredMeter === i;
            const intensity = i / meterBars;
            const barColor = intensity < 0.4
              ? "hsl(var(--primary))"
              : intensity < 0.7
              ? "hsl(var(--chart-amber))"
              : "hsl(var(--destructive))";

            return (
              <motion.div
                key={i}
                onMouseEnter={() => setHoveredMeter(i)}
                onMouseLeave={() => setHoveredMeter(null)}
                className="flex-1 rounded-sm cursor-pointer transition-all"
                style={{
                  height: `${30 + i * 3}%`,
                  backgroundColor: filled ? barColor : "hsl(var(--muted))",
                  opacity: filled ? (isHovered ? 1 : 0.8) : 0.3,
                  boxShadow: filled && isHovered ? `0 0 8px ${barColor}` : "none",
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => update("units", String(Math.round(((i + 1) / meterBars) * 50)))}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-muted-foreground/40 font-mono">0</span>
          <span className="text-[10px] text-muted-foreground/40 font-mono">50 {typeData.unit}</span>
        </div>
      </div>

      {/* Manual input */}
      <div>
        <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5 block">
          Units ({typeData.unit})
        </label>
        <input
          type="number"
          step="0.1"
          value={formData.units || ""}
          placeholder="0"
          className="w-full px-4 py-3 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 font-mono transition-colors"
          onChange={(e) => update("units", e.target.value)}
        />
      </div>

      {/* Green energy toggle — styled switch */}
      <motion.div
        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
          isGreen ? "border-primary/30 bg-primary/5" : "border-primary/5 bg-muted/10"
        }`}
        onClick={() => update("green", isGreen ? "false" : "true")}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isGreen ? "bg-primary/20" : "bg-muted"
          }`}>
            <Leaf size={16} className={isGreen ? "text-primary" : "text-muted-foreground"} />
          </div>
          <div>
            <span className="text-sm text-foreground block">Green energy provider</span>
            <span className="text-[10px] text-muted-foreground/50 font-mono">
              {isGreen ? "~30% lower emissions factor" : "Reduces your carbon factor"}
            </span>
          </div>
        </div>
        <div className={`w-11 h-6 rounded-full transition-colors relative ${isGreen ? "bg-primary" : "bg-muted"}`}>
          <motion.div
            className="absolute top-1 w-4 h-4 rounded-full bg-foreground"
            animate={{ left: isGreen ? 24 : 4 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        </div>
      </motion.div>

      {/* Real-time emission readout */}
      {units > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-primary/10 bg-gradient-to-r from-muted/20 to-transparent"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono uppercase">Session Emissions</span>
            <span className="font-mono text-lg font-bold text-primary">
              {(typeData.co2 * units * (isGreen ? 0.7 : 1)).toFixed(1)} kg
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EnergyForm;
