import { motion } from "framer-motion";
import { Leaf, Drumstick, Wheat, Milk, Salad } from "lucide-react";

const foodItems = [
  { key: "vegetables", label: "Vegetables", icon: Salad, co2: 2, color: "hsl(var(--primary))" },
  { key: "chicken", label: "Chicken", icon: Drumstick, co2: 6.9, color: "hsl(var(--chart-amber))" },
  { key: "beef", label: "Beef", icon: Drumstick, co2: 27, color: "hsl(var(--destructive))" },
  { key: "dairy", label: "Dairy", icon: Milk, co2: 3.2, color: "hsl(var(--chart-blue))" },
  { key: "grains", label: "Grains", icon: Wheat, co2: 1.4, color: "hsl(var(--chart-teal))" },
];

interface FoodFormProps {
  formData: Record<string, string>;
  update: (key: string, value: string) => void;
}

const FoodForm = ({ formData, update }: FoodFormProps) => {
  const selected = formData.mealType || "vegetables";
  const portion = parseFloat(formData.portion || "0.3");

  return (
    <div className="space-y-6">
      {/* Ingredient Picker — visual cards instead of dropdown */}
      <div>
        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3 block">
          Pick Your Protein
        </span>
        <div className="grid grid-cols-5 gap-2">
          {foodItems.map((item, i) => {
            const active = selected === item.key;
            const Icon = item.icon;
            return (
              <motion.button
                key={item.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => update("mealType", item.key)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                  active
                    ? "border-primary/40 bg-primary/10"
                    : "border-primary/5 bg-muted/20 hover:border-primary/20 hover:bg-muted/40"
                }`}
                style={active ? { boxShadow: `0 0 20px ${item.color}20` } : {}}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: active ? `${item.color}20` : "hsl(var(--muted))" }}
                >
                  <Icon size={18} style={{ color: active ? item.color : "hsl(var(--muted-foreground))" }} />
                </div>
                <span className={`text-xs font-heading font-600 ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="food-indicator"
                    className="absolute -bottom-px left-1/4 right-1/4 h-0.5 rounded-full bg-primary"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* CO₂ impact bar for the selected ingredient */}
      <div className="glass-card rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-mono uppercase">Impact per kg</span>
          <span className="font-mono text-sm text-foreground">
            {foodItems.find(f => f.key === selected)?.co2} kg CO₂
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(((foodItems.find(f => f.key === selected)?.co2 || 2) / 27) * 100, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ backgroundColor: foodItems.find(f => f.key === selected)?.color }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground/50 font-mono">Low</span>
          <span className="text-[10px] text-muted-foreground/50 font-mono">High (Beef: 27)</span>
        </div>
      </div>

      {/* Meal description */}
      <div>
        <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5 block">
          Meal Description
        </label>
        <input
          className="w-full px-4 py-3 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 font-body transition-colors"
          placeholder="e.g. Grilled chicken with rice and salad"
          onChange={(e) => update("desc", e.target.value)}
        />
      </div>

      {/* Portion slider with visual plate */}
      <div>
        <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3 block">
          Portion Size
        </label>
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0">
            <motion.div
              animate={{ scale: 0.6 + portion * 0.8 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full border-2 border-primary/20 flex items-center justify-center"
              style={{ background: `radial-gradient(circle, hsl(var(--primary) / 0.15), transparent)` }}
            >
              <span className="font-mono text-lg font-bold text-primary">{portion.toFixed(1)}</span>
            </motion.div>
            <span className="text-[10px] text-muted-foreground/50 font-mono text-center block mt-1">kg</span>
          </div>
          <div className="flex-1 space-y-2">
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={portion}
              onChange={(e) => update("portion", e.target.value)}
              className="w-full accent-primary h-1.5 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(34,197,94,0.4)]"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/40 font-mono">
              <span>Snack</span>
              <span>Regular</span>
              <span>Feast</span>
            </div>
          </div>
        </div>
      </div>

      {/* Organic toggle — pill style */}
      <div
        className="flex items-center justify-between p-3 rounded-lg border border-primary/5 bg-muted/10 cursor-pointer hover:border-primary/15 transition-colors"
        onClick={() => update("organic", formData.organic === "true" ? "false" : "true")}
      >
        <div className="flex items-center gap-3">
          <Leaf size={16} className="text-primary" />
          <span className="text-sm text-foreground">Organic produce</span>
        </div>
        <div className={`w-10 h-5 rounded-full transition-colors relative ${formData.organic === "true" ? "bg-primary" : "bg-muted"}`}>
          <motion.div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-foreground"
            animate={{ left: formData.organic === "true" ? 22 : 2 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        </div>
      </div>
    </div>
  );
};

export default FoodForm;
