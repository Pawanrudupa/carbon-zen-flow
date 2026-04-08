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
      <main className="ml-16 p-6 md:p-10 max-w-6xl mx-auto">
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
      </main>
    </div>
  );
};

export default Settings;
