import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    indexedDB.deleteDatabase("ai-resume-builder");
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
});

test("onboarding renders at phone width and reviews the canonical template", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: /Upload your resume/i })).toBeVisible();
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  await page.screenshot({ path: "artifacts/home-390x844.png", fullPage: true });
  await page.getByRole("button", { name: /Load Example Template/i }).click();
  await expect(page.getByRole("heading", { name: /Extraction Notes/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Open Workspace/i })).toBeVisible();
});

test("complete local workspace flow is responsive and keyboard reachable", async ({ page }) => {
  await page.getByRole("button", { name: /start instantly with a sample/i }).click();
  await page.waitForURL("**/workspace");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole("heading", { name: "Identity and contact" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Compile", exact: true })).toBeVisible();
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  await page.screenshot({ path: "artifacts/workspace-1440x900.png", fullPage: true });

  const headline = page.getByLabel("Headline");
  await headline.focus();
  await headline.fill("Staff Product Engineer");
  await expect(page.getByText("Saving…")).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(headline).toHaveValue("Software Engineer");
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(headline).toHaveValue("Staff Product Engineer");

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByRole("tab", { name: "Editor" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "PDF Preview" })).toBeVisible();
  await page.screenshot({ path: "artifacts/workspace-1024x768.png", fullPage: true });
  await page.getByRole("tab", { name: "PDF Preview" }).click();
  await expect(page.getByRole("button", { name: "Compile locally" })).toBeVisible();
});

test("AI configuration state is represented honestly", async ({ page }) => {
  await page.getByRole("button", { name: /start instantly with a sample/i }).click();
  await page.waitForURL("**/workspace");
  await page.getByRole("button", { name: "Target Job" }).click();
  const offline = page.getByText(/AI is disabled until/i).first();
  if (await offline.count()) {
    await expect(page.getByRole("button", { name: "Analyze evidence" })).toBeDisabled();
    await expect(offline).toBeVisible();
  } else {
    await page.getByLabel("Job description").fill("A product software engineering role requiring React, TypeScript, API integration, testing, and clear collaboration across a cross-functional team.");
    await expect(page.getByRole("button", { name: "Analyze evidence" })).toBeEnabled();
    await expect(page.getByText(/processed by Google Gemini/i).first()).toBeVisible();
  }
});

test("format controls, section reordering, and guidance audit operate accurately", async ({ page }) => {
  await page.getByRole("button", { name: /start instantly with a sample/i }).click();
  await page.waitForURL("**/workspace");
  await page.setViewportSize({ width: 1440, height: 900 });

  // 1. Format Panel
  await page.getByRole("button", { name: "Format" }).click();
  await expect(page.getByRole("heading", { name: "Format & Layout" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Compact/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Minimal/i })).toBeVisible();

  // Switch to Minimal preset
  const minimalBtn = page.getByRole("button", { name: /Minimal/i });
  await minimalBtn.click();
  await expect(minimalBtn).toHaveAttribute("aria-pressed", "true");

  // Test section reordering
  const moveDown = page.getByRole("button", { name: /Move Skills down/i });
  await moveDown.click();

  // 2. Guidance Panel
  await page.getByRole("button", { name: "Guidance" }).click();
  await expect(page.getByRole("heading", { name: "EngineeringResumes Guidance" }).first()).toBeVisible();
  await expect(page.getByText(/Advisory & Regional Notice/i).first()).toBeVisible();
  await expect(page.getByText(/Passed Checks/i).first()).toBeVisible();
  await expect(page.getByText(/No arbitrary ATS score/i).first()).toBeVisible();

  // Visual capture at 1440x900
  await page.screenshot({ path: "artifacts/guidance-1440x900.png", fullPage: true });
  await page.getByRole("button", { name: "Format" }).first().click();
  await page.screenshot({ path: "artifacts/format-1440x900.png", fullPage: true });

  // Visual capture at 1024x768
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.screenshot({ path: "artifacts/format-1024x768.png", fullPage: true });
  await page.getByRole("button", { name: "guidance", exact: true }).click();
  await page.screenshot({ path: "artifacts/guidance-1024x768.png", fullPage: true });

  // Visual capture at 390x844
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/guidance-390x844.png", fullPage: true });
  await page.getByRole("button", { name: "format", exact: true }).click();
  await page.screenshot({ path: "artifacts/format-390x844.png", fullPage: true });
});
