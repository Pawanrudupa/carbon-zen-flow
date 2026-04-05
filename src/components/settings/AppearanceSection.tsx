import { useState } from "react";
import { Check, Moon, Sun, Monitor } from "lucide-react";
import { toast } from "sonner";

const themes = [
  { id: "dark", label: "Dark", icon: Moon, available: true },
  { id: "system", label: "System", icon: Monitor, available: true },
  { id: "light", label: "Light", icon: Sun, available: false },
];

const accents = [
  { id: "green", color: "hsl(142 71% 45%)" },
  { id: "teal", color: "hsl(173 80% 40%)" },
  { id: "blue", color: "hsl(217 91% 60%)" },
  { id: "purple", color: "hsl(255 82% 76%)" },
  { id: "amber", color: "hsl(38 95% 51%)" },
];

const AppearanceSection = () => {
  const [theme, setTheme] = useState("dark");
  const [accent, setAccent] = useState("green");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">Appearance</h2>
        <p className="text-sm text-muted-foreground italic mt-1">CarbonLedger is designed for dark mode. Light mode coming soon.</p>
      </div>

      {/* Theme cards */}
      <div className="grid grid-cols-3 gap-3">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => t.available && setTheme(t.id)}
            className={`relative rounded-xl border p-4 text-center transition-all ${
              theme === t.id
                ? "border-primary bg-primary/5"
                : t.available
                  ? "border-primary/10 bg-card hover:border-primary/30"
                  : "border-primary/5 bg-card opacity-50 cursor-not-allowed"
            }`}
          >
            {!t.available && (
              <span className="absolute top-2 right-2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Coming soon</span>
            )}
            <t.icon size={24} className={`mx-auto mb-2 ${theme === t.id ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-sm text-foreground">{t.label}</span>
            {theme === t.id && <Check size={14} className="absolute top-2 left-2 text-primary" />}
          </button>
        ))}
      </div>

      {/* Accent color */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Accent color</h3>
        <div className="flex gap-3">
          {accents.map((a) => (
            <button
              key={a.id}
              onClick={() => { setAccent(a.id); toast.success("Accent preview updated."); }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                accent === a.id ? "ring-2 ring-offset-2 ring-offset-background" : ""
              }`}
              style={{ backgroundColor: a.color, boxShadow: accent === a.id ? `0 0 12px ${a.color}` : undefined, "--tw-ring-color": a.color } as React.CSSProperties}
            >
              {accent === a.id && <Check size={16} className="text-background" />}
            </button>
          ))}
        </div>
      </div>

      {/* Data density */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Data density</h3>
        <div className="inline-flex rounded-lg bg-card border border-primary/10 p-1">
          {(["comfortable", "compact"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDensity(d)}
              className={`px-4 py-1.5 rounded-md text-sm transition-all capitalize ${
                density === d ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppearanceSection;
