import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/* ─── Accent colour palette ─── */
export type AccentId = "green" | "teal" | "blue" | "purple" | "amber";

export interface AccentTokens {
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

export const GREEN_THEME_TOKENS = ACCENT_MAP.green;

export const GREEN_THEME_STYLE: React.CSSProperties = {
  "--primary": GREEN_THEME_TOKENS.primary,
  "--secondary": GREEN_THEME_TOKENS.secondary,
  "--ring": GREEN_THEME_TOKENS.ring,
  "--sidebar-primary": GREEN_THEME_TOKENS.sidebarPrimary,
  "--sidebar-ring": GREEN_THEME_TOKENS.sidebarRing,
  "--muted-foreground": GREEN_THEME_TOKENS.mutedForeground,
  "--border": `${GREEN_THEME_TOKENS.primary.split(" ")[0]} ${GREEN_THEME_TOKENS.primary.split(" ")[1]} 25% / 0.15`,
  "--sidebar-border": `${GREEN_THEME_TOKENS.primary.split(" ")[0]} ${GREEN_THEME_TOKENS.primary.split(" ")[1]} 25% / 0.15`,
  "--glow-primary": `0 0 30px rgba(${GREEN_THEME_TOKENS.glowRgb}, 0.15)`,
  "--glow-primary-strong": `0 0 40px rgba(${GREEN_THEME_TOKENS.glowRgb}, 0.25)`,
} as React.CSSProperties;

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
export function applyAccent(id: AccentId) {
  const tokens = ACCENT_MAP[id] || ACCENT_MAP.green;
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

export function applyGreenThemeToRoot() {
  applyAccent("green");
}

export function applyDensity(d: Density) {
  document.documentElement.setAttribute("data-density", d);
}

const getUserStorageKey = (userId: string, key: "accent" | "density") => `cz-${key}-${userId}`;

/* ─── Provider ─── */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [accent, setAccentState] = useState<AccentId>("green");
  const [density, setDensityState] = useState<Density>("comfortable");

  // Sync with user state (login / switch accounts / logout)
  useEffect(() => {
    // Clean up legacy non-namespaced keys to avoid cross-user contamination
    if (localStorage.getItem("cz-accent")) {
      localStorage.removeItem("cz-accent");
    }
    if (localStorage.getItem("cz-density")) {
      localStorage.removeItem("cz-density");
    }

    if (!user) {
      // Unauthenticated state: always default to green & comfortable
      setAccentState("green");
      setDensityState("comfortable");
      applyAccent("green");
      applyDensity("comfortable");
      return;
    }

    const userId = user.id;
    const cachedAccent = (localStorage.getItem(getUserStorageKey(userId, "accent")) as AccentId) || null;
    const metaAccent = (user.user_metadata?.theme_color as AccentId) || null;
    const resolvedAccent: AccentId = (cachedAccent && ACCENT_MAP[cachedAccent] ? cachedAccent : null) ||
                                     (metaAccent && ACCENT_MAP[metaAccent] ? metaAccent : null) ||
                                     "green";

    const cachedDensity = (localStorage.getItem(getUserStorageKey(userId, "density")) as Density) || null;
    const metaDensity = (user.user_metadata?.density as Density) || null;
    const resolvedDensity: Density = (cachedDensity === "compact" || cachedDensity === "comfortable" ? cachedDensity : null) ||
                                      (metaDensity === "compact" || metaDensity === "comfortable" ? metaDensity : null) ||
                                      "comfortable";

    setAccentState(resolvedAccent);
    setDensityState(resolvedDensity);
    applyAccent(resolvedAccent);
    applyDensity(resolvedDensity);

    // Save to user-scoped local storage if missing
    localStorage.setItem(getUserStorageKey(userId, "accent"), resolvedAccent);
    localStorage.setItem(getUserStorageKey(userId, "density"), resolvedDensity);

    // Also attempt to fetch from profiles table if column exists
    supabase
      .from("profiles")
      .select("theme_color, density")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          const dbData = data as { theme_color?: string; density?: string };
          if (dbData.theme_color && ACCENT_MAP[dbData.theme_color as AccentId]) {
            const dbAccent = dbData.theme_color as AccentId;
            setAccentState(dbAccent);
            applyAccent(dbAccent);
            localStorage.setItem(getUserStorageKey(userId, "accent"), dbAccent);
          }
          if (dbData.density === "compact" || dbData.density === "comfortable") {
            setDensityState(dbData.density);
            applyDensity(dbData.density);
            localStorage.setItem(getUserStorageKey(userId, "density"), dbData.density);
          }
        }
      })
      .catch(() => {
        // Gracefully ignore if column does not exist on remote profiles table
      });
  }, [user]);

  const setAccent = useCallback((id: AccentId) => {
    if (!ACCENT_MAP[id]) return;
    setAccentState(id);
    applyAccent(id);

    if (user?.id) {
      localStorage.setItem(getUserStorageKey(user.id, "accent"), id);
      // Persist to user_metadata on Supabase auth (travels across devices)
      supabase.auth.updateUser({ data: { theme_color: id } }).catch((err) => {
        console.warn("Failed to persist theme to auth user metadata:", err);
      });
      // Also try saving to profiles table if supported
      supabase
        .from("profiles")
        .update({ theme_color: id } as any)
        .eq("id", user.id)
        .then()
        .catch(() => {});
    }
  }, [user]);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    applyDensity(d);

    if (user?.id) {
      localStorage.setItem(getUserStorageKey(user.id, "density"), d);
      // Persist to user_metadata on Supabase auth
      supabase.auth.updateUser({ data: { density: d } }).catch((err) => {
        console.warn("Failed to persist density to auth user metadata:", err);
      });
      // Also try saving to profiles table if supported
      supabase
        .from("profiles")
        .update({ density: d } as any)
        .eq("id", user.id)
        .then()
        .catch(() => {});
    }
  }, [user]);

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
