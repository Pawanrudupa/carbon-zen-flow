import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UtensilsCrossed, Car, Zap, ShoppingBag, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import FoodForm from "@/components/log-entry/FoodForm";
import TransportForm from "@/components/log-entry/TransportForm";
import EnergyForm from "@/components/log-entry/EnergyForm";
import ShoppingForm from "@/components/log-entry/ShoppingForm";
import DashboardLayout from "@/components/layout/DashboardLayout";
import type { MLPrediction } from "@/utils/mlModel";

const tabs = [
  { key: "food", label: "Food", icon: UtensilsCrossed, color: "hsl(var(--primary))" },
  { key: "transport", label: "Transport", icon: Car, color: "hsl(var(--chart-blue))" },
  { key: "energy", label: "Energy", icon: Zap, color: "hsl(var(--chart-amber))" },
  { key: "shopping", label: "Shopping", icon: ShoppingBag, color: "hsl(var(--chart-purple))" },
];

// Computed from train_model.py synthetic dataset (mean = 46.867 kg CO₂)
const DATASET_AVG_ENTRY_CO2 = 46.867;
const MAE_PERCENT = ((4.134 / DATASET_AVG_ENTRY_CO2) * 100).toFixed(1);

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

const LogEntry = () => {
  const [activeTab, setActiveTab] = useState("food");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ML model dynamic loading & prediction state
  const [mlModule, setMlModule] = useState<typeof import("@/utils/mlModel") | null>(() => cachedMlModule);
  const [loadingModel, setLoadingModel] = useState(() => !cachedMlModule);
  const [moduleLoadFailed, setModuleLoadFailed] = useState(false);
  const [mlPrediction, setMlPrediction] = useState<MLPrediction | null>(null);

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

  const co2Estimate = useMemo(() => {
    if (!mlModule) return 0;
    try {
      let prediction: MLPrediction;

      if (activeTab === "food") {
        prediction = mlModule.predictEmission({
          category: "food",
          mealType: (formData.mealType as any) || "vegetables",
          portionKg: parseFloat(formData.portion || "0.3"),
          isOrganic: formData.organic === "true",
          isLocal: formData.local === "true",
        });
      } else if (activeTab === "transport") {
        prediction = mlModule.predictEmission({
          category: "transport",
          mode: (formData.mode as any) || "car_petrol",
          distanceKm: parseFloat(formData.distance || "0"),
          passengers: parseInt(formData.passengers || "1"),
        });
      } else if (activeTab === "energy") {
        const energyTypeMap: Record<string, string> = {
          electricity: "electricity_coal",
          gas: "natural_gas",
          heating: "heating_oil",
        };
        const rawType = formData.energyType || "electricity_coal";
        const energyType = (energyTypeMap[rawType] || rawType) as any;

        prediction = mlModule.predictEmission({
          category: "energy",
          energyType,
          units: parseFloat(formData.units || "0"),
          isGreenTariff: formData.green === "true",
        });
      } else {
        prediction = mlModule.predictEmission({
          category: "shopping",
          shopCategory: (formData.shopCategory as any) || "clothing",
          isSecondhand: formData.secondhand === "true",
          quantity: parseInt(formData.quantity || "1"),
        });
      }

      setMlPrediction(prediction);
      return prediction.co2_kg;
    } catch {
      return 0;
    }
  }, [activeTab, formData, mlModule]);

  const { data: recentEntries } = useQuery({
    queryKey: ["anomaly-check", user?.id, activeTab],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("entries")
        .select("co2_kg")
        .eq("user_id", user.id)
        .eq("category", activeTab)
        .order("logged_at", { ascending: false })
        .limit(30);
      return (data || []).map((e: any) => e.co2_kg as number);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const anomaly = useMemo(() => {
    if (!mlModule || !recentEntries || recentEntries.length < 6 || co2Estimate === 0) return null;
    return mlModule.detectAnomaly(co2Estimate, recentEntries);
  }, [co2Estimate, recentEntries, mlModule]);

  const buildDescription = () => {
    if (activeTab === "food") return formData.desc || `${formData.mealType || "vegetables"} meal`;
    if (activeTab === "transport") return `${formData.mode || "car"} - ${formData.distance || 0}km`;
    if (activeTab === "energy") return `${formData.energyType || "electricity"} - ${formData.units || 0} units`;
    if (activeTab === "shopping") return formData.itemDesc || `${formData.shopCategory || "clothing"} purchase`;
    return "";
  };

  const handleSubmit = async () => {
    if (!user || submitting) return;
    setSubmitting(true);

    // Await module if not yet loaded so we never submit an uncalculated entry
    let mod = mlModule;
    if (!mod) {
      try {
        mod = await getMlModel();
        setMlModule(mod);
      } catch (err) {
        mlModulePromise = null;
        setSubmitting(false);
        setModuleLoadFailed(true);
        toast.error("A new version of this app is available. Please refresh the page.");
        return;
      }
    }

    let finalCo2 = co2Estimate;
    if (finalCo2 === 0 && mod) {
      try {
        let prediction: MLPrediction;
        if (activeTab === "food") {
          prediction = mod.predictEmission({
            category: "food",
            mealType: (formData.mealType as any) || "vegetables",
            portionKg: parseFloat(formData.portion || "0.3"),
            isOrganic: formData.organic === "true",
            isLocal: formData.local === "true",
          });
        } else if (activeTab === "transport") {
          prediction = mod.predictEmission({
            category: "transport",
            mode: (formData.mode as any) || "car_petrol",
            distanceKm: parseFloat(formData.distance || "0"),
            passengers: parseInt(formData.passengers || "1"),
          });
        } else if (activeTab === "energy") {
          const energyTypeMap: Record<string, string> = {
            electricity: "electricity_coal",
            gas: "natural_gas",
            heating: "heating_oil",
          };
          const rawType = formData.energyType || "electricity_coal";
          const energyType = (energyTypeMap[rawType] || rawType) as any;
          prediction = mod.predictEmission({
            category: "energy",
            energyType,
            units: parseFloat(formData.units || "0"),
            isGreenTariff: formData.green === "true",
          });
        } else {
          prediction = mod.predictEmission({
            category: "shopping",
            shopCategory: (formData.shopCategory as any) || "clothing",
            isSecondhand: formData.secondhand === "true",
            quantity: parseInt(formData.quantity || "1"),
          });
        }
        finalCo2 = prediction.co2_kg;
      } catch {
        finalCo2 = 0;
      }
    }

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
      co2_kg: parseFloat(finalCo2.toFixed(2)),
      logged_at: new Date().toISOString(),
      metadata: formData as any,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to save entry: " + error.message);
    } else {
      toast.success(`Logged ${finalCo2.toFixed(1)} kg CO₂`);
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
    <DashboardLayout>
      <div className="max-w-4xl mx-auto w-full">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground text-sm hover:text-primary transition-colors mb-6">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2">Log Entry</h1>
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
              {moduleLoadFailed ? (
                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    A new version of this app is available. Please refresh the page to continue.
                  </p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-heading font-600 hover:opacity-90 transition-opacity"
                  >
                    Refresh
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || loadingModel || !mlModule}
                  className="w-full py-3 rounded-lg font-heading font-600 transition-all text-foreground disabled:opacity-50"
                  style={{ backgroundColor: `${activeColor}20`, boxShadow: `0 0 30px ${activeColor}15` }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 40px ${activeColor}30`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 0 30px ${activeColor}15`; }}
                >
                  {submitting ? "Saving…" : loadingModel ? "Calculating…" : "Log Entry"}
                </button>
              )}
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center h-fit sticky top-20">
            <span className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest mb-4">Estimated CO₂</span>
            {moduleLoadFailed ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
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
              <div className="flex flex-col items-center justify-center py-8 my-auto">
                <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-3" />
                <span className="font-mono text-xs text-muted-foreground animate-pulse">Calculating…</span>
              </div>
            ) : (
              <>
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
              </>
            )}

            {/* ML Model Badge */}
            {mlPrediction && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 space-y-2 w-full"
              >
                {/* Model attribution */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                  <span className="text-[10px] font-mono text-primary/60 uppercase tracking-wider">
                    ML Model · GBR · R²={mlModule?.MODEL_META.r2_score ?? 0.995}
                  </span>
                  <span className="text-[10px] font-mono text-primary/60">
                    ±4.134 kg (≈{MAE_PERCENT}% of a typical logged entry)
                  </span>
                </div>

                {/* Breakdown */}
                <p className="text-[10px] font-mono text-muted-foreground/60 text-center leading-relaxed">
                  {mlPrediction.breakdown}
                </p>

                {/* Contextual tip */}
                {mlPrediction.tip && (
                  <div className="px-3 py-2 rounded-lg bg-muted/20 border border-muted/30">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      💡 {mlPrediction.tip}
                    </p>
                  </div>
                )}

                {/* Anomaly Alert or Cold-start note */}
                {recentEntries && recentEntries.length < 6 ? (
                  <div className="px-3 py-1.5 rounded-lg bg-muted/10 border border-muted/20 text-center">
                    <p className="text-xs font-mono text-muted-foreground/60">
                      Anomaly detection unlocks after 6 logged entries in this category.
                    </p>
                  </div>
                ) : anomaly?.isAnomaly ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`px-3 py-2 rounded-lg border ${
                      anomaly.severity === "extreme"
                        ? "bg-destructive/10 border-destructive/30"
                        : "bg-amber-500/10 border-amber-500/30"
                    }`}
                  >
                    <p className={`text-xs font-mono font-semibold ${
                      anomaly.severity === "extreme" ? "text-destructive" : "text-amber-500"
                    }`}>
                      ⚠ Anomaly Detected (z={anomaly.zScore}σ)
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {anomaly.message}
                    </p>
                  </motion.div>
                ) : null}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LogEntry;
