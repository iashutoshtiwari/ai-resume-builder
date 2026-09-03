import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

test("TeX Live compiles generated output and the supplied canonical template in Chromium", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.getByRole("button", { name: /start instantly with a sample/i }).click();
  await page.waitForURL("**/workspace");
  await page.getByRole("button", { name: /compile/i }).first().click();
  await expect(page.getByRole("button", { name: "Download PDF" })).toBeEnabled({ timeout: 150_000 });
  await expect(page.getByText(/LaTeX compilation failed/i)).toHaveCount(0);
  const canonicalTex = await readFile(resolve(process.cwd(), "src/features/latex/templates/canonical.tex"), "utf8");
  await page.getByRole("button", { name: "LaTeX Source" }).click();
  const editor = page.locator(".monaco-editor").first();
  await editor.click({ position: { x: 180, y: 180 } });
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.insertText(canonicalTex);
  await expect(page.getByText("STALE", { exact: true })).toBeVisible();
  const recompile = page.getByRole("button", { name: "Recompile" });
  await recompile.click();
  await expect(page.getByText("STALE", { exact: true })).toHaveCount(0, { timeout: 150_000 });
  await page.waitForTimeout(1_000);
  const pdfInfo = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("ai-resume-builder");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const record = await new Promise<{ pdfBlob?: Blob }>((resolve, reject) => {
      const request = database.transaction("workspaces").objectStore("workspaces").get("primary");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const bytes = new Uint8Array(await record.pdfBlob!.arrayBuffer());
    const text = new TextDecoder("latin1").decode(bytes);
    return {
      header: text.slice(0, 5),
      size: bytes.byteLength,
    };
  });
  expect(pdfInfo.header).toBe("%PDF-");
  expect(pdfInfo.size).toBeGreaterThan(5_000);

  await page.getByRole("button", { name: "Restore ArqeloCV Template" }).click();
  await expect(page.getByRole("alertdialog")).toContainText(/replace those changes/i);
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("heading", { name: "Manual LaTeX Override" })).toBeVisible();

  await page.getByRole("button", { name: "Restore ArqeloCV Template" }).click();
  await page.getByRole("button", { name: "Restore template" }).click();
  await expect(page.getByRole("heading", { name: "Generated / Structured Mode" })).toBeVisible();
});
