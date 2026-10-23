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

  const stored = await page.evaluate(async () => {
    const list = await fetch("/api/workspaces", { credentials: "same-origin" });
    if (!list.ok) return { error: "list", status: list.status };
    const workspaces = (await list.json()) as { id: string; role: string }[];
    const workspace = workspaces[0];
    if (!workspace || workspace.role !== "owner") return { error: "workspace" };
    const base = `/api/workspaces/${workspace.id}/conversations`;
    const created = await fetch(base, {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "same-origin", body: JSON.stringify({ title: "Persisted browser thread" }),
    });
    if (!created.ok) return { error: "create", status: created.status };
    const conversation = (await created.json()) as { id: string };
    const message = await fetch(`${base}/${conversation.id}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      credentials: "same-origin", body: JSON.stringify({ content: "Private browser message" }),
    });
    const retrieved = await fetch(`${base}/${conversation.id}/messages`, {
      credentials: "same-origin",
    });
    const rows = (await retrieved.json()) as { content: string; role: string }[];
    const deleted = await fetch(`${base}/${conversation.id}`, {
      method: "DELETE", credentials: "same-origin",
    });
    return {
      workspaceRole: workspace.role, created: created.status,
      message: message.status, read: retrieved.status,
      messageContent: rows[0]?.content, messageRole: rows[0]?.role,
      deleted: deleted.status,
    };
  });
  expect(stored).toMatchObject({
    workspaceRole: "owner", created: 201, message: 201, read: 200,
    messageContent: "Private browser message", messageRole: "user", deleted: 204,
  });

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
