import { motion } from "framer-motion";
import { Leaf, Drumstick, Wheat, Milk, Salad } from "lucide-react";
import { FOOD_COEFFICIENTS } from "@/utils/mlModel";

const foodItems = [
  { key: "vegetables", label: "Vegetables", icon: Salad, co2: FOOD_COEFFICIENTS.vegetables.base_per_kg, color: "hsl(var(--primary))" },
  { key: "chicken", label: "Chicken", icon: Drumstick, co2: FOOD_COEFFICIENTS.chicken.base_per_kg, color: "hsl(var(--chart-amber))" },
  { key: "beef", label: "Beef", icon: Drumstick, co2: FOOD_COEFFICIENTS.beef.base_per_kg, color: "hsl(var(--destructive))" },
  { key: "dairy", label: "Dairy", icon: Milk, co2: FOOD_COEFFICIENTS.dairy.base_per_kg, color: "hsl(var(--chart-blue))" },
  { key: "grains", label: "Grains", icon: Wheat, co2: FOOD_COEFFICIENTS.grains.base_per_kg, color: "hsl(var(--chart-teal))" },
];

interface FoodFormProps {
  formData: Record<string, string>;
  update: (key: string, value: string) => void;
}

const FoodForm = ({ formData, update }: FoodFormProps) => {
  const selected = formData.mealType || "vegetables";
  const portion = parseFloat(formData.portion || "0.3");
  const selectedFood = foodItems.find(f => f.key === selected) || foodItems[0];

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
          <span className="text-xs text-muted-foreground font-mono uppercase">ML Model Intensity</span>
          <span className="font-mono text-sm text-foreground">
            {selectedFood.co2.toFixed(1)} kg CO₂/kg
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((selectedFood.co2 / FOOD_COEFFICIENTS.beef.base_per_kg) * 100, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ backgroundColor: selectedFood.color }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground/50 font-mono">Low</span>
          <span className="text-[10px] text-muted-foreground/50 font-mono">High (Beef: {FOOD_COEFFICIENTS.beef.base_per_kg.toFixed(1)})</span>
        </div>
      </div>

      {/* Meal description */}
      <div>
        <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5 block">
          Meal Description
        </label>
        <input
          value={formData.desc || ""}
          className="w-full px-4 py-3 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 font-body transition-colors"
          placeholder="e.g. Grilled chicken with rice and salad"
          onChange={(e) => update("desc", e.target.value)}
        />
      </div>

      {/* Portion size — visual plates */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
            Portion Size
          </span>
          <span className="font-mono text-xs text-primary font-bold">
            {portion >= 0.8 ? "Feast" : portion >= 0.5 ? "Hearty" : portion >= 0.3 ? "Standard" : "Snack"} · {(portion * 1000).toFixed(0)}g
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Snack", grams: 150, value: "0.15" },
            { label: "Standard", grams: 300, value: "0.3" },
            { label: "Hearty", grams: 500, value: "0.5" },
            { label: "Feast", grams: 800, value: "0.8" },
          ].map((p) => {
            const active = formData.portion === p.value || (!formData.portion && p.value === "0.3");
            return (
              <button
                key={p.value}
                onClick={() => update("portion", p.value)}
                className={`py-3 px-2 rounded-lg border text-center transition-all ${
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-primary/5 bg-muted/20 text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <span className="text-xs font-mono font-semibold block">{p.label}</span>
                <span className="text-[10px] text-muted-foreground/50 font-mono">{p.grams}g</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles — organic & local */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => update("organic", formData.organic === "true" ? "false" : "true")}
          className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
            formData.organic === "true"
              ? "border-primary/30 bg-primary/5"
              : "border-primary/5 bg-muted/20 hover:border-primary/15"
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            formData.organic === "true" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          }`}>
            <Leaf size={16} />
          </div>
          <div>
            <span className="text-xs font-heading font-600 text-foreground block">Organic</span>
            <span className="text-[10px] text-muted-foreground font-mono">Certified organic</span>
          </div>
        </button>

        <button
          onClick={() => update("local", formData.local === "true" ? "false" : "true")}
          className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
            formData.local === "true"
              ? "border-primary/30 bg-primary/5"
              : "border-primary/5 bg-muted/20 hover:border-primary/15"
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            formData.local === "true" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          }`}>
            <span className="text-xs">📍</span>
          </div>
          <div>
            <span className="text-xs font-heading font-600 text-foreground block">Locally Sourced</span>
            <span className="text-[10px] text-muted-foreground font-mono">&lt; 50 km radius</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default FoodForm;
