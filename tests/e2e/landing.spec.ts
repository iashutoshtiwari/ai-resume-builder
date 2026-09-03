import { expect, test } from "@playwright/test";

test("landing page renders with ArqeloCV branding and zero errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  // Check title & meta
  await expect(page).toHaveTitle("ArqeloCV — AI Resume Builder for Software Engineers");
  const metaDescription = page.locator('meta[name="description"]');
  await expect(metaDescription).toHaveAttribute(
    "content",
    /ArqeloCV is an AI resume builder for software engineers/i
  );

  // Check H1
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toHaveText("AI Resume Builder for Software Engineers");

  // Check navigation
  await expect(page.getByRole("link", { name: "ArqeloCV" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "How it works" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Features" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Trust" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "FAQ" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Source" }).first()).toBeVisible();

  // Check key sections
  await expect(page.getByRole("heading", { name: "Engineered for technical resumes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Three straightforward steps" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tailored without making things up." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Answers to common questions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Build a better engineering resume." })).toBeVisible();

  // Check FAQ answers
  await expect(page.getByText(/The system prompt strictly instructs the model to only use facts/i)).toBeVisible();

  // Check footer author link
  const authorLink = page.locator('footer a[href="https://ashutoshtiwari.dev"]');
  await expect(authorLink).toHaveText("Ashutosh");
  await expect(authorLink).toBeVisible();

  // Capture desktop full page
  await page.screenshot({ path: "artifacts/landing-1440x900.png", fullPage: true });

  // Capture mobile full page
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/landing-390x844.png", fullPage: true });

  // Ensure no unhandled console errors occurred
  expect(consoleErrors.filter((e) => !e.includes("favicon"))).toEqual([]);
});
