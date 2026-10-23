import { expect, test } from "@playwright/test";

test("unauthenticated users are redirected to login", async ({ page }) => {
  await page.goto("/chat");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("registration form requires a strong password", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await page.getByLabel("Display name").fill("Example User");
  await page.getByLabel("Email").fill("example@example.com");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("minlength", "12");
});

test("login form displays sanitized authentication errors", async ({ page }) => {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 401, contentType: "application/json",
      body: JSON.stringify({ detail: "Invalid email or password" }),
    });
  });
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password", { exact: true }).fill("nottherightpassword");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("form [role=alert]")).toHaveText("Invalid email or password");
});

