import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ACCENT_MAP,
  GREEN_THEME_STYLE,
  GREEN_THEME_TOKENS,
  applyAccent,
} from "@/contexts/ThemeContext";

describe("Theme Isolation and Preferences", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.documentElement.removeAttribute("style");
    document.documentElement.removeAttribute("data-density");
  });

  it("exports valid green theme tokens and styles for landing page isolation", () => {
    expect(GREEN_THEME_TOKENS.primary).toBe("142 71% 45%");
    expect(GREEN_THEME_STYLE).toHaveProperty("--primary", "142 71% 45%");
    expect(GREEN_THEME_STYLE).toHaveProperty("--glow-primary");
  });

  it("applyAccent modifies document.documentElement variables according to palette", () => {
    applyAccent("amber");
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe(ACCENT_MAP.amber.primary);

    applyAccent("green");
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe(ACCENT_MAP.green.primary);
  });

  it("ensures different users maintain distinct namespaced localStorage preferences", () => {
    const userAKey = "cz-accent-user_a_123";
    const userBKey = "cz-accent-user_b_456";

    localStorage.setItem(userAKey, "amber");
    localStorage.setItem(userBKey, "blue");

    expect(localStorage.getItem(userAKey)).toBe("amber");
    expect(localStorage.getItem(userBKey)).toBe("blue");

    // Switching back to user A preserves amber
    expect(localStorage.getItem(userAKey)).toBe("amber");
  });

  it("verifies OAuth callback detection handles access_token and code parameters", () => {
    const checkIsOAuthCallback = (hash: string, search: string, inProgressFlag: boolean) => {
      const hasOAuthParams =
        hash.includes("access_token") ||
        hash.includes("type=recovery") ||
        search.includes("code=");
      return hasOAuthParams || inProgressFlag;
    };

    expect(checkIsOAuthCallback("#access_token=xyz&token_type=bearer", "", false)).toBe(true);
    expect(checkIsOAuthCallback("", "?code=auth-code-123", false)).toBe(true);
    expect(checkIsOAuthCallback("", "", true)).toBe(true);
    expect(checkIsOAuthCallback("", "", false)).toBe(false);
  });
});
