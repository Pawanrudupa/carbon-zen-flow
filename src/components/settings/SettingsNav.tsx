import { User, Target, Bell, Palette, Shield, CreditCard, AlertTriangle } from "lucide-react";

const items = [
  { id: "profile", label: "Profile", icon: User },
  { id: "targets", label: "Targets & Goals", icon: Target },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "privacy", label: "Privacy & Data", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
];

const SettingsNav = ({ active, onChange }: { active: string; onChange: (id: string) => void }) => (
  <nav className="w-full md:w-[240px] flex-shrink-0 space-y-1">
    {items.map((item) => {
      const isActive = active === item.id;
      const isDanger = item.id === "danger";
      return (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
            isActive
              ? isDanger
                ? "bg-destructive/10 text-destructive border-l-2 border-destructive"
                : "bg-primary/10 text-primary border-l-2 border-primary"
              : isDanger
                ? "text-destructive/60 hover:text-destructive hover:bg-destructive/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <item.icon size={18} />
          <span>{item.label}</span>
        </button>
      );
    })}
  </nav>
);

export default SettingsNav;
