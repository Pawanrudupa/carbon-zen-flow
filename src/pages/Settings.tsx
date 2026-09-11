import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import SettingsNav from "@/components/settings/SettingsNav";
import ProfileSection from "@/components/settings/ProfileSection";
import TargetsSection from "@/components/settings/TargetsSection";
import NotificationsSection from "@/components/settings/NotificationsSection";
import AppearanceSection from "@/components/settings/AppearanceSection";
import PrivacySection from "@/components/settings/PrivacySection";
import BillingSection from "@/components/settings/BillingSection";
import DangerZoneSection from "@/components/settings/DangerZoneSection";
// Fallback model metadata — used when the ML chunk fails to load.
// Must stay in sync with mlModel.ts MODEL_META.
export const MODEL_META_FALLBACK = {
  algorithm: "GradientBoostingRegressor",
  r2_score: 0.9950,
  mae_kg: 4.134,
  training_samples: 4000,
  dataset:
    "Synthetic dataset based on IPCC AR6 emission factors, EPA guidelines, and IEA energy data",
} as const;

const sections: Record<string, React.FC> = {
  profile: ProfileSection,
  targets: TargetsSection,
  notifications: NotificationsSection,
  appearance: AppearanceSection,
  privacy: PrivacySection,
  billing: BillingSection,
  danger: DangerZoneSection,
};

const Settings = () => {
  const [modelMeta, setModelMeta] = useState(MODEL_META_FALLBACK);

  useEffect(() => {
    import("@/utils/mlModel")
      .then((mod) => {
        setModelMeta({
          algorithm: mod.MODEL_META.algorithm,
          r2_score: mod.MODEL_META.r2_score,
          mae_kg: mod.MODEL_META.mae_kg,
          training_samples: mod.MODEL_META.training_samples,
          dataset: mod.MODEL_META.dataset,
        });
      })
      .catch((err) => {
        console.error("Settings: failed to load ML module, using fallback metadata:", err);
      });
  }, []);
  const [searchParams] = useSearchParams();
  const [active, setActive] = useState(() => {
    const section = searchParams.get("section");
    return section && sections[section] ? section : "profile";
  });

  useEffect(() => {
    const section = searchParams.get("section");
    if (section && sections[section]) setActive(section);
  }, [searchParams]);
  const Section = sections[active] ?? ProfileSection;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="ml-0 md:ml-16 p-6 pb-24 md:p-10 max-w-6xl mx-auto w-full overflow-x-hidden px-4 md:px-0">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-heading text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your CarbonLedger experience</p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-8 mt-8">
          <SettingsNav active={active} onChange={setActive} />
          <motion.div
            key={active}
            className="flex-1 min-w-0"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Section />
          </motion.div>
        </div>

        {/* ML Model Section */}
        <div className="mt-10 rounded-xl border p-5" style={{ borderColor: "rgba(34,197,94,0.12)" }}>
          <h3 className="font-semibold text-sm mb-4">AI & ML Emission Model</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-primary/5">
              <span className="text-sm text-muted-foreground">Algorithm</span>
              <span className="font-mono text-xs text-primary">GradientBoostingRegressor</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-primary/5">
              <span className="text-sm text-muted-foreground">R² Score (accuracy)</span>
              <span className="font-mono text-xs text-primary">{modelMeta.r2_score} / 1.0</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-primary/5">
              <span className="text-sm text-muted-foreground">Mean Absolute Error</span>
              <span className="font-mono text-xs text-primary">±{modelMeta.mae_kg} kg CO₂</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-primary/5">
              <span className="text-sm text-muted-foreground">Training samples</span>
              <span className="font-mono text-xs text-primary">{modelMeta.training_samples.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-primary/5">
              <span className="text-sm text-muted-foreground">Emission features</span>
              <span className="font-mono text-xs text-primary">13 input variables</span>
            </div>
            <div className="pt-2 space-y-1.5">
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                {modelMeta.dataset}. Model trained offline using scikit-learn
                and coefficients extracted for real-time browser inference.
              </p>
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                Trained on a synthetic dataset generated from IPCC AR6 / EPA / IEA emission factors, not live-measured emissions. Coefficients are static and do not update from user data.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
