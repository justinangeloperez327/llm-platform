import { expect, test } from "@playwright/test";

test.skip(process.env.RUN_AUTH_INTEGRATION !== "1", "Requires live FastAPI + PostgreSQL");

test("actual registration, cookie, logout, login and protected page", async ({ page, context }) => {
  const email = "browser-" + Date.now() + "-" + Math.floor(Math.random() * 100000) + "@example.com";
  const password = "correct-horse-battery-staple-2026";
  await page.goto("/register");
  await page.getByLabel("Display name").fill("Real Browser User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/chat$/, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: "What would you like to explore?" })).toBeVisible();
  const cookies = await context.cookies("http://127.0.0.1:3000");
  const session = cookies.find((cookie) => cookie.name === "llm_session");
  expect(session).toBeDefined();
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Lax");

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 15000 });
  await page.goto("/chat");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/chat$/, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: "What would you like to explore?" })).toBeVisible();
});
