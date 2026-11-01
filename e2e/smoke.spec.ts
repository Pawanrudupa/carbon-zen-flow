import { test, expect } from "@playwright/test";

test.describe("CarbonZen Platform Smoke Tests", () => {
  test("Landing page loads with correct branding and hero content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/CarbonZen/i);

    // Verify presence of core landing navigation and call to action
    const getStartedBtn = page.getByRole("link", { name: /get started/i }).first();
    await expect(getStartedBtn).toBeVisible();
  });

  test("Unauthenticated access to protected routes redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/sign in to carbonzen/i)).toBeVisible();
  });

  test("Login page renders email, password inputs, and Google auth", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.getByPlaceholder("you@example.com");
    const passwordInput = page.getByPlaceholder("••••••••");
    const signInBtn = page.getByRole("button", { name: /sign in/i });
    const googleBtn = page.getByRole("button", { name: /continue with google/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(signInBtn).toBeVisible();
    await expect(googleBtn).toBeVisible();
  });

  test("Signup page is accessible from login page", async ({ page }) => {
    await page.goto("/login");
    const signUpLink = page.getByRole("link", { name: /sign up/i });
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();
    await expect(page).toHaveURL(/\/signup/);
  });
});
