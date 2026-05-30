import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client"; // Adjust path if necessary

// This array acts as a blueprint, mapping your UI labels to the exact Supabase database columns
const NOTIFICATION_CONFIG = [
  { dbKey: "notify_daily_reminder", label: "Daily logging reminder", desc: "Remind me to log today's entries", hasTime: true },
  { dbKey: "notify_weekly_summary", label: "Weekly summary", desc: "Email digest every Monday morning" },
  { dbKey: "notify_challenge_deadlines", label: "Challenge deadlines", desc: "Alert me 24h before a challenge expires" },
  { dbKey: "notify_monthly_report", label: "Monthly report ready", desc: "Notify when auto-report is generated" },
  { dbKey: "notify_household_activity", label: "Household activity", desc: "When a member logs a big entry" },
  { dbKey: "notify_goal_achieved", label: "Goal achieved", desc: "Celebrate when I hit a monthly target" },
] as const;

type DbKey = typeof NOTIFICATION_CONFIG[number]["dbKey"];

// Converts a "HH:MM" local-time string to UTC "HH:MM"
const localToUtc = (localTime: string): string => {
  const date = new Date(`1970-01-01T${localTime}:00`);
  // getTimezoneOffset() returns the difference UTC−local in minutes
  const offsetMinutes = new Date().getTimezoneOffset();
  date.setMinutes(date.getMinutes() + offsetMinutes);
  return date.toISOString().substring(11, 16);
};

// Converts a "HH:MM" UTC string back to the user's local "HH:MM"
const utcToLocal = (utcTime: string): string => {
  const date = new Date(`1970-01-01T${utcTime}:00Z`);
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
};

const NotificationsSection = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Single state object that mirrors our Supabase database table exactly
  const [prefs, setPrefs] = useState<Record<string, any>>({
    notify_daily_reminder: false,
    notify_daily_time: "20:00",
    notify_weekly_summary: false,
    notify_challenge_deadlines: false,
    notify_monthly_report: false,
    notify_household_activity: false,
    notify_goal_achieved: false,
  });

  // Fetch the user's actual saved preferences on load
  useEffect(() => {
    const fetchPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          notify_daily_reminder, notify_daily_time, notify_weekly_summary, 
          notify_challenge_deadlines, notify_monthly_report, 
          notify_household_activity, notify_goal_achieved
        `)
        .eq('id', user.id)
        .single();

      if (data && !error) {
        // Convert the stored UTC time back to the user's local time for display
        setPrefs({
          ...data,
          notify_daily_time: data.notify_daily_time
            ? utcToLocal(data.notify_daily_time)
            : "20:00",
        });
      } else if (error) {
        console.error("Error fetching preferences:", error);
      }
      setIsLoading(false);
    };

    fetchPreferences();
  }, []);

  const toggle = (dbKey: DbKey) => {
    setPrefs((prev) => ({ ...prev, [dbKey]: !prev[dbKey] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Convert the user's chosen local time to UTC before persisting
      const prefsToSave = {
        ...prefs,
        notify_daily_time: prefs.notify_daily_time
          ? localToUtc(prefs.notify_daily_time)
          : prefs.notify_daily_time,
      };

      const { error } = await supabase
        .from('profiles')
        .update(prefsToSave)
        .eq('id', user.id);

      if (error) {
        console.error("Error saving preferences:", error);
        toast.error("Failed to save settings. Please try again.");
      } else {
        toast.success("Settings saved successfully.");
      }
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <div className="text-muted-foreground animate-pulse">Loading preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold text-foreground">Notifications</h2>

      <div className="space-y-1">
        {NOTIFICATION_CONFIG.map((item) => (
          <div key={item.dbKey} className="flex items-center justify-between py-3 border-b border-primary/5 last:border-0">
            <div className="min-w-0 pr-4">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>

              {/* Only show time input if it's the daily reminder AND it is toggled ON */}
              {item.hasTime && prefs[item.dbKey] && (
                <Input
                  type="time"
                  value={prefs.notify_daily_time}
                  onChange={(e) => setPrefs(prev => ({ ...prev, notify_daily_time: e.target.value }))}
                  className="mt-2 w-32 bg-card border-primary/20 font-mono text-xs h-8"
                />
              )}
            </div>

            {/* The Switch reads its state directly from the DB-aligned prefs object */}
            <Switch
              checked={prefs[item.dbKey]}
              onCheckedChange={() => toggle(item.dbKey)}
            />
          </div>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
      >
        {isSaving ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
};

export default NotificationsSection;