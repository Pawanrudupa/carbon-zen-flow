import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, Car, Zap, ShoppingBag, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import CountUp from "@/components/dashboard/CountUp";

const tabs = [
  { key: "food", label: "Food", icon: UtensilsCrossed, color: "#22C55E" },
  { key: "transport", label: "Transport", icon: Car, color: "#3B82F6" },
  { key: "energy", label: "Energy", icon: Zap, color: "#F59E0B" },
  { key: "shopping", label: "Shopping", icon: ShoppingBag, color: "#A78BFA" },
];

const emissionFactors: Record<string, Record<string, number>> = {
  food: { beef: 27, chicken: 6.9, vegetables: 2, dairy: 3.2, grains: 1.4 },
  transport: { car: 0.21, flight: 0.255, train: 0.041, bus: 0.089, cycle: 0 },
  energy: { electricity: 0.82, gas: 2.04, heating: 1.5 },
  shopping: { clothing: 15, electronics: 50, furniture: 30, books: 1, used: 0.5 },
};

const LogEntry = () => {
  const [activeTab, setActiveTab] = useState("food");
  const [formData, setFormData] = useState<Record<string, string>>({});

  const co2Estimate = useMemo(() => {
    const factors = emissionFactors[activeTab];
    if (activeTab === "food") {
      const type = formData.mealType || "vegetables";
      const portion = parseFloat(formData.portion || "0.3");
      return (factors[type] || 2) * portion;
    }
    if (activeTab === "transport") {
      const mode = formData.mode || "car";
      const dist = parseFloat(formData.distance || "0");
      const passengers = parseInt(formData.passengers || "1");
      return ((factors[mode] || 0.21) * dist) / Math.max(passengers, 1);
    }
    if (activeTab === "energy") {
      const type = formData.energyType || "electricity";
      const units = parseFloat(formData.units || "0");
      return (factors[type] || 0.82) * units;
    }
    if (activeTab === "shopping") {
      const cat = formData.shopCategory || "clothing";
      const isUsed = formData.secondhand === "true";
      return isUsed ? factors.used : (factors[cat] || 15);
    }
    return 0;
  }, [activeTab, formData]);

  const update = (key: string, value: string) => setFormData((p) => ({ ...p, [key]: value }));

  const inputClass =
    "w-full px-4 py-3 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 font-body transition-colors";
  const labelClass = "text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5 block";
  const selectClass = inputClass + " appearance-none";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground text-sm hover:text-primary transition-colors mb-6">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <h1 className="font-heading font-700 text-2xl md:text-3xl text-foreground mb-2">Log Entry</h1>
        <p className="text-muted-foreground text-sm mb-8">Track your carbon in under 60 seconds.</p>

        <div className="flex gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setActiveTab(t.key);
                setFormData({});
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-heading font-600 transition-all ${
                activeTab === t.key
                  ? "bg-primary/10 text-primary glow-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <t.icon size={16} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-card rounded-xl p-6 space-y-5">
            {activeTab === "food" && (
              <>
                <div>
                  <label className={labelClass}>Meal Description</label>
                  <input className={inputClass} placeholder="e.g. Grilled chicken with rice" onChange={(e) => update("desc", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Primary Ingredient</label>
                  <select className={selectClass} onChange={(e) => update("mealType", e.target.value)}>
                    <option value="vegetables">Vegetables</option>
                    <option value="chicken">Chicken</option>
                    <option value="beef">Beef</option>
                    <option value="dairy">Dairy</option>
                    <option value="grains">Grains</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Portion (kg)</label>
                  <input className={inputClass} type="number" step="0.1" defaultValue="0.3" onChange={(e) => update("portion", e.target.value)} />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="accent-primary" onChange={(e) => update("organic", String(e.target.checked))} />
                  <label className="text-sm text-muted-foreground">Organic produce</label>
                </div>
              </>
            )}

            {activeTab === "transport" && (
              <>
                <div>
                  <label className={labelClass}>Mode of Transport</label>
                  <select className={selectClass} onChange={(e) => update("mode", e.target.value)}>
                    <option value="car">Car (petrol)</option>
                    <option value="bus">Bus</option>
                    <option value="train">Train</option>
                    <option value="flight">Flight (short haul)</option>
                    <option value="cycle">Bicycle</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Distance (km)</label>
                  <input className={inputClass} type="number" step="1" defaultValue="0" onChange={(e) => update("distance", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Passengers</label>
                  <input className={inputClass} type="number" step="1" defaultValue="1" min="1" onChange={(e) => update("passengers", e.target.value)} />
                </div>
              </>
            )}

            {activeTab === "energy" && (
              <>
                <div>
                  <label className={labelClass}>Energy Type</label>
                  <select className={selectClass} onChange={(e) => update("energyType", e.target.value)}>
                    <option value="electricity">Electricity</option>
                    <option value="gas">Natural Gas</option>
                    <option value="heating">Heating</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Units (kWh / m³)</label>
                  <input className={inputClass} type="number" step="0.1" defaultValue="0" onChange={(e) => update("units", e.target.value)} />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="accent-primary" onChange={(e) => update("green", String(e.target.checked))} />
                  <label className="text-sm text-muted-foreground">Green energy provider</label>
                </div>
              </>
            )}

            {activeTab === "shopping" && (
              <>
                <div>
                  <label className={labelClass}>Category</label>
                  <select className={selectClass} onChange={(e) => update("shopCategory", e.target.value)}>
                    <option value="clothing">Clothing</option>
                    <option value="electronics">Electronics</option>
                    <option value="furniture">Furniture</option>
                    <option value="books">Books</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Estimated Value (₹)</label>
                  <input className={inputClass} type="number" step="100" defaultValue="0" onChange={(e) => update("value", e.target.value)} />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="accent-primary" onChange={(e) => update("secondhand", String(e.target.checked))} />
                  <label className="text-sm text-muted-foreground">Secondhand / Pre-owned</label>
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>Notes (optional)</label>
              <textarea className={inputClass + " h-20 resize-none"} placeholder="Any additional context..." />
            </div>

            <button className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-heading font-600 transition-all hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              Log Entry
            </button>
          </div>

          {/* Live CO₂ estimate */}
          <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center h-fit sticky top-20">
            <span className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest mb-4">
              Estimated CO₂
            </span>
            <motion.div
              key={co2Estimate}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <span className="font-mono text-4xl font-bold text-primary">
                {co2Estimate.toFixed(1)}
              </span>
              <span className="font-mono text-sm text-muted-foreground block mt-1">kg CO₂</span>
            </motion.div>
            <div className="mt-6 w-full h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${Math.min((co2Estimate / 10) * 100, 100)}%`,
                  boxShadow: "0 0 8px rgba(34,197,94,0.4)",
                }}
              />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground/50 mt-2">
              vs daily avg: 10.4 kg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogEntry;
