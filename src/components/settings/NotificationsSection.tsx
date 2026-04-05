import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const initialToggles = [
  { id: "daily", label: "Daily logging reminder", desc: "Remind me to log today's entries", on: true, hasTime: true },
  { id: "weekly", label: "Weekly summary", desc: "Email digest every Monday morning", on: true },
  { id: "challenge", label: "Challenge deadlines", desc: "Alert me 24h before a challenge expires", on: true },
  { id: "report", label: "Monthly report ready", desc: "Notify when auto-report is generated", on: false },
  { id: "household", label: "Household activity", desc: "When a member logs a big entry", on: true },
  { id: "goal", label: "Goal achieved", desc: "Celebrate when I hit a monthly target", on: true },
  { id: "tips", label: "Tips & suggestions", desc: "Weekly AI-generated reduction tips", on: false },
];

const NotificationsSection = () => {
  const [toggles, setToggles] = useState(initialToggles);
  const [time, setTime] = useState("20:00");

  const toggle = (id: string) =>
    setToggles((prev) => prev.map((t) => (t.id === id ? { ...t, on: !t.on } : t)));

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold text-foreground">Notifications</h2>

      <div className="space-y-1">
        {toggles.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-3 border-b border-primary/5 last:border-0">
            <div className="min-w-0 pr-4">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
              {item.hasTime && item.on && (
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-2 w-32 bg-card border-primary/20 font-mono text-xs h-8"
                />
              )}
            </div>
            <Switch checked={item.on} onCheckedChange={() => toggle(item.id)} />
          </div>
        ))}
      </div>

      <Button onClick={() => toast.success("Settings saved.")} className="bg-primary text-primary-foreground hover:bg-primary/90">
        Save changes
      </Button>
    </div>
  );
};

export default NotificationsSection;
