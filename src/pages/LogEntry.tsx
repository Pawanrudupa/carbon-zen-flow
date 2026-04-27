import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UtensilsCrossed, Car, Zap, ShoppingBag, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import FoodForm from "@/components/log-entry/FoodForm";
import TransportForm from "@/components/log-entry/TransportForm";
import EnergyForm from "@/components/log-entry/EnergyForm";
import ShoppingForm from "@/components/log-entry/ShoppingForm";

const tabs = [
  { key: "food", label: "Food", icon: UtensilsCrossed, color: "hsl(var(--primary))" },
  { key: "transport", label: "Transport", icon: Car, color: "hsl(var(--chart-blue))" },
  { key: "energy", label: "Energy", icon: Zap, color: "hsl(var(--chart-amber))" },
  { key: "shopping", label: "Shopping", icon: ShoppingBag, color: "hsl(var(--chart-purple))" },
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
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      const isGreen = formData.green === "true";
      return (factors[type] || 0.82) * units * (isGreen ? 0.7 : 1);
    }
    if (activeTab === "shopping") {
      const cat = formData.shopCategory || "clothing";
      const isUsed = formData.secondhand === "true";
      return isUsed ? factors.used : (factors[cat] || 15);
    }
    return 0;
  }, [activeTab, formData]);

  const buildDescription = () => {
    if (activeTab === "food") return formData.desc || `${formData.mealType || "vegetables"} meal`;
    if (activeTab === "transport") return `${formData.mode || "car"} - ${formData.distance || 0}km`;
    if (activeTab === "energy") return `${formData.energyType || "electricity"} - ${formData.units || 0} units`;
    if (activeTab === "shopping") return formData.itemDesc || `${formData.shopCategory || "clothing"} purchase`;
    return "";
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    // Fire profile upsert in the background — don't await it.
    // The AuthContext already does this on login; this is a safety net only.
    supabase.from("profiles").upsert(
      {
        id: user.id,
        username:
          user.user_metadata?.display_name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "User",
      },
      { onConflict: "id", ignoreDuplicates: true }
    ).then(); // non-blocking

    const { error } = await supabase.from("entries").insert({
      user_id: user.id,
      category: activeTab,
      description: [buildDescription(), notes].filter(Boolean).join(" — "),
      co2_kg: parseFloat(co2Estimate.toFixed(2)),
      logged_at: new Date().toISOString(),
      metadata: formData as any,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to save entry: " + error.message);
    } else {
      toast.success(`Logged ${co2Estimate.toFixed(1)} kg CO₂`);
      // Single invalidation covers CarbonOrb, CategoryBreakdown, TrendSparklines, LogTimeline
      queryClient.invalidateQueries({ queryKey: ["dashboard-entries"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-entries"] });
      setFormData({});
      setNotes("");
    }
  };

  const update = (key: string, value: string) => setFormData((p) => ({ ...p, [key]: value }));
  const activeColor = tabs.find(t => t.key === activeTab)?.color || "hsl(var(--primary))";

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
              onClick={() => { setActiveTab(t.key); setFormData({}); }}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-heading font-600 transition-all ${
                activeTab === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
              style={activeTab === t.key ? { backgroundColor: `${t.color}15`, boxShadow: `0 0 20px ${t.color}10` } : {}}
            >
              <t.icon size={16} style={activeTab === t.key ? { color: t.color } : {}} />
              <span className="hidden sm:inline">{t.label}</span>
              {activeTab === t.key && (
                <motion.div layoutId="tab-indicator" className="absolute -bottom-px left-2 right-2 h-0.5 rounded-full" style={{ backgroundColor: t.color }} />
              )}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-card rounded-xl p-6">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                {activeTab === "food" && <FoodForm formData={formData} update={update} />}
                {activeTab === "transport" && <TransportForm formData={formData} update={update} />}
                {activeTab === "energy" && <EnergyForm formData={formData} update={update} />}
                {activeTab === "shopping" && <ShoppingForm formData={formData} update={update} />}
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-input border border-primary/10 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 font-body transition-colors h-20 resize-none"
                  placeholder="Any additional context..."
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 rounded-lg font-heading font-600 transition-all text-foreground disabled:opacity-50"
                style={{ backgroundColor: `${activeColor}20`, boxShadow: `0 0 30px ${activeColor}15` }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 40px ${activeColor}30`; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 0 30px ${activeColor}15`; }}
              >
                {submitting ? "Saving…" : "Log Entry"}
              </button>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center h-fit sticky top-20">
            <span className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest mb-4">Estimated CO₂</span>
            <motion.div key={co2Estimate} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <span className="font-mono text-4xl font-bold" style={{ color: activeColor }}>{co2Estimate.toFixed(1)}</span>
              <span className="font-mono text-sm text-muted-foreground block mt-1">kg CO₂</span>
            </motion.div>
            <div className="mt-6 w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div className="h-full rounded-full transition-all duration-500" animate={{ width: `${Math.min((co2Estimate / 10) * 100, 100)}%` }} style={{ backgroundColor: activeColor, boxShadow: `0 0 8px ${activeColor}60` }} />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground/50 mt-2">vs daily avg: 10.4 kg</span>

            <div className="mt-6 relative w-28 h-28">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                <motion.circle cx="50" cy="50" r="42" fill="none" stroke={activeColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={264} initial={{ strokeDashoffset: 264 }} animate={{ strokeDashoffset: 264 - (Math.min(co2Estimate / 10, 1) * 264) }} transition={{ duration: 0.6, ease: "easeOut" }} style={{ filter: `drop-shadow(0 0 6px ${activeColor})` }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-xs text-muted-foreground/60">{Math.round(Math.min(co2Estimate / 10, 1) * 100)}%</span>
                <span className="text-[9px] text-muted-foreground/40 font-mono">of daily</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogEntry;
