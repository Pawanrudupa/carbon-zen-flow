import { createContext, useContext, useEffect, useState, ReactNode } from "react";

/* ─── Accent colour palette ─── */
export type AccentId = "green" | "teal" | "blue" | "purple" | "amber";

interface AccentTokens {
  primary: string;        // HSL values (no hsl() wrapper)
  secondary: string;
  ring: string;
  sidebarPrimary: string;
  sidebarRing: string;
  mutedForeground: string;
  glowRgb: string;        // RGB for glow effects
}

export const ACCENT_MAP: Record<AccentId, AccentTokens> = {
  green: {
    primary: "142 71% 45%",
    secondary: "142 64% 37%",
    ring: "142 71% 45%",
    sidebarPrimary: "142 71% 45%",
    sidebarRing: "142 71% 45%",
    mutedForeground: "142 69% 58%",
    glowRgb: "34, 197, 94",
  },
  teal: {
    primary: "173 80% 40%",
    secondary: "173 72% 33%",
    ring: "173 80% 40%",
    sidebarPrimary: "173 80% 40%",
    sidebarRing: "173 80% 40%",
    mutedForeground: "173 70% 55%",
    glowRgb: "13, 183, 164",
  },
  blue: {
    primary: "217 91% 60%",
    secondary: "217 80% 50%",
    ring: "217 91% 60%",
    sidebarPrimary: "217 91% 60%",
    sidebarRing: "217 91% 60%",
    mutedForeground: "217 85% 70%",
    glowRgb: "59, 130, 246",
  },
  purple: {
    primary: "255 82% 76%",
    secondary: "255 72% 64%",
    ring: "255 82% 76%",
    sidebarPrimary: "255 82% 76%",
    sidebarRing: "255 82% 76%",
    mutedForeground: "255 75% 80%",
    glowRgb: "168, 128, 247",
  },
  amber: {
    primary: "38 95% 51%",
    secondary: "38 85% 42%",
    ring: "38 95% 51%",
    sidebarPrimary: "38 95% 51%",
    sidebarRing: "38 95% 51%",
    mutedForeground: "38 90% 65%",
    glowRgb: "245, 158, 11",
  },
};

/* ─── Data density ─── */
export type Density = "comfortable" | "compact";

/* ─── Context ─── */
interface ThemeContextType {
  accent: AccentId;
  setAccent: (id: AccentId) => void;
  density: Density;
  setDensity: (d: Density) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/* ─── Apply helpers ─── */
function applyAccent(id: AccentId) {
  const tokens = ACCENT_MAP[id];
  const root = document.documentElement;

  root.style.setProperty("--primary", tokens.primary);
  root.style.setProperty("--secondary", tokens.secondary);
  root.style.setProperty("--ring", tokens.ring);
  root.style.setProperty("--sidebar-primary", tokens.sidebarPrimary);
  root.style.setProperty("--sidebar-ring", tokens.sidebarRing);
  root.style.setProperty("--muted-foreground", tokens.mutedForeground);
  root.style.setProperty("--border", `${tokens.primary.split(" ")[0]} ${tokens.primary.split(" ")[1]} 25% / 0.15`);
  root.style.setProperty("--sidebar-border", `${tokens.primary.split(" ")[0]} ${tokens.primary.split(" ")[1]} 25% / 0.15`);

  root.style.setProperty("--glow-primary", `0 0 30px rgba(${tokens.glowRgb}, 0.15)`);
  root.style.setProperty("--glow-primary-strong", `0 0 40px rgba(${tokens.glowRgb}, 0.25)`);
}

function applyDensity(d: Density) {
  document.documentElement.setAttribute("data-density", d);
}

/* ─── Provider ─── */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentId>(() => {
    return (localStorage.getItem("cz-accent") as AccentId) || "green";
  });

  const [density, setDensityState] = useState<Density>(() => {
    return (localStorage.getItem("cz-density") as Density) || "comfortable";
  });

  // Apply on mount and when values change
  useEffect(() => {
    applyAccent(accent);
    localStorage.setItem("cz-accent", accent);
  }, [accent]);

  useEffect(() => {
    applyDensity(density);
    localStorage.setItem("cz-density", density);
  }, [density]);

  const setAccent = (id: AccentId) => setAccentState(id);
  const setDensity = (d: Density) => setDensityState(d);

  return (
    <ThemeContext.Provider value={{ accent, setAccent, density, setDensity }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
