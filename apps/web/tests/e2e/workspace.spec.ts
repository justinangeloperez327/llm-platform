import { expect, test } from "@playwright/test";

test("chat preview does not pretend an AI model is connected", async ({ page }) => {
  await page.goto("/chat");
  await expect(page.getByRole("heading", { name: "What would you like to explore?" })).toBeVisible();
  await expect(page.getByText("This is an interface preview.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save draft" })).toBeDisabled();
  const starter = "Explain the difference between RAG and fine-tuning";
  await page.getByRole("button", { name: `Use prompt: ${starter}` }).click();
  await expect(page.getByRole("textbox", { name: "Prompt draft" })).toHaveValue(starter);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("status")).toContainText("No AI request was sent");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Prompt draft" })).toHaveValue(starter);
});

test("settings save theme preferences and can reset", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Workspace settings" })).toBeVisible();
  await page.getByRole("button", { name: "Light Bright, high-contrast workspace" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.reload();
  await expect(page.getByRole("button", { name: "Light Bright, high-contrast workspace" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Reset preferences" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("mobile navigation opens, routes and closes", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile layout only");
  await page.goto("/chat");
  const open = page.getByRole("button", { name: "Open navigation" });
  await open.click();
  const dialog = page.getByRole("dialog", { name: "Mobile navigation" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("link", { name: "Settings" }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { name: "Workspace settings" })).toBeVisible();
});

test("sample conversation is clearly marked as illustrative", async ({ page }) => {
  await page.goto("/chat?sample=rag");
  await expect(page.getByRole("heading", { name: "Understanding RAG" })).toBeVisible();
  await expect(page.getByText("Illustrative answer (not generated)")).toBeVisible();
});
