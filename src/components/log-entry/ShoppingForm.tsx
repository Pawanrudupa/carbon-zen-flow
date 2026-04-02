import { motion } from "framer-motion";
import { Shirt, Laptop, Sofa, BookOpen, Recycle, Tag } from "lucide-react";

const categories = [
  { key: "clothing", label: "Clothing", icon: Shirt, co2: 15, color: "hsl(var(--chart-purple))" },
  { key: "electronics", label: "Electronics", icon: Laptop, co2: 50, color: "hsl(var(--chart-blue))" },
  { key: "furniture", label: "Furniture", icon: Sofa, co2: 30, color: "hsl(var(--chart-amber))" },
  { key: "books", label: "Books", icon: BookOpen, co2: 1, color: "hsl(var(--primary))" },
];

interface ShoppingFormProps {
  formData: Record<string, string>;
  update: (key: string, value: string) => void;
}

const ShoppingForm = ({ formData, update }: ShoppingFormProps) => {
  const selected = formData.shopCategory || "clothing";
  const isSecondhand = formData.secondhand === "true";
  const value = parseFloat(formData.value || "0");
  const catData = categories.find(c => c.key === selected)!;

  const co2 = isSecondhand ? 0.5 : catData.co2;

  return (
    <div className="space-y-6">
      {/* Category selector — receipt-style cards */}
      <div>
        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3 block">
          What did you buy?
        </span>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat, i) => {
            const active = selected === cat.key;
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => update("shopCategory", cat.key)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                  active
                    ? "border-primary/30 bg-primary/5"
                    : "border-primary/5 bg-muted/20 hover:border-primary/15"
                }`}
              >
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: active ? `${cat.color}20` : "hsl(var(--muted))",
                    boxShadow: active ? `0 0 16px ${cat.color}20` : "none",
                  }}
                >
                  <Icon size={20} style={{ color: active ? cat.color : "hsl(var(--muted-foreground))" }} />
                </div>
                <div className="text-left">
                  <span className={`text-sm font-heading font-600 block ${active ? "text-foreground" : "text-muted-foreground"}`}>
                    {cat.label}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground/50">
                    ~{cat.co2} kg CO₂
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Item description */}
      <div>
        <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5 block">
          Item Description
        </label>
        <input
          className="w-full px-4 py-3 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 font-body transition-colors"
          placeholder={`e.g. ${selected === "clothing" ? "Winter jacket" : selected === "electronics" ? "Wireless headphones" : selected === "furniture" ? "Desk lamp" : "Novel"}`}
          onChange={(e) => update("itemDesc", e.target.value)}
        />
      </div>

      {/* Price tag input */}
      <div>
        <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5 block">
          <Tag size={12} className="inline mr-1.5" />
          Estimated Value
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-muted-foreground text-sm">₹</span>
          <input
            type="number"
            step="100"
            value={formData.value || ""}
            placeholder="0"
            className="w-full pl-8 pr-4 py-3 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 font-mono transition-colors"
            onChange={(e) => update("value", e.target.value)}
          />
        </div>
      </div>

      {/* New vs Secondhand — dramatic toggle */}
      <div>
        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3 block">
          Condition
        </span>
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            onClick={() => update("secondhand", "false")}
            className={`p-4 rounded-xl border text-center transition-all duration-300 ${
              !isSecondhand
                ? "border-chart-amber/30 bg-chart-amber/5"
                : "border-primary/5 bg-muted/20 hover:border-primary/15"
            }`}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-2xl block mb-2">✨</span>
            <span className={`text-sm font-heading font-600 block ${!isSecondhand ? "text-foreground" : "text-muted-foreground"}`}>
              Brand New
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/50 mt-1 block">
              {catData.co2} kg CO₂
            </span>
          </motion.button>

          <motion.button
            onClick={() => update("secondhand", "true")}
            className={`p-4 rounded-xl border text-center transition-all duration-300 ${
              isSecondhand
                ? "border-primary/30 bg-primary/5"
                : "border-primary/5 bg-muted/20 hover:border-primary/15"
            }`}
            whileTap={{ scale: 0.98 }}
          >
            <Recycle size={24} className={`mx-auto mb-2 ${isSecondhand ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-sm font-heading font-600 block ${isSecondhand ? "text-foreground" : "text-muted-foreground"}`}>
              Pre-owned
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/50 mt-1 block">
              0.5 kg CO₂
            </span>
          </motion.button>
        </div>
      </div>

      {/* Impact comparison */}
      {isSecondhand && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-primary/20 bg-primary/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Recycle size={18} className="text-primary" />
            </div>
            <div>
              <span className="text-sm font-heading font-600 text-foreground block">
                Great choice! 🌍
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                You're saving {(catData.co2 - 0.5).toFixed(1)} kg CO₂ vs buying new
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Receipt summary */}
      <motion.div
        className="glass-card rounded-xl p-4 border-t-2 border-dashed border-primary/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mb-2">
          <span>RECEIPT</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
        <div className="border-t border-dashed border-primary/10 pt-2 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{catData.label}</span>
            <span className="font-mono text-foreground">{co2.toFixed(1)} kg CO₂</span>
          </div>
          {value > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Value</span>
              <span className="font-mono text-foreground">₹{value.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Condition</span>
            <span className="font-mono text-foreground">{isSecondhand ? "Pre-owned" : "New"}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ShoppingForm;
