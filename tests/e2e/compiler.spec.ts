import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

test("TeX Live compiles the rendered resume and canonical main.tex in Chromium", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.getByRole("button", { name: /start instantly with a sample/i }).click();
  await page.waitForURL("**/workspace");
  await page.getByRole("button", { name: /compile/i }).first().click();
  await expect(page.getByRole("button", { name: "Download PDF" })).toBeEnabled({ timeout: 150_000 });
  await expect(page.getByText(/LaTeX compilation failed/i)).toHaveCount(0);
  const mainTex = await readFile(resolve(process.cwd(), "main.tex"), "utf8");
  await page.getByRole("button", { name: "LaTeX Source" }).click();
  const editor = page.locator(".monaco-editor").first();
  await editor.click({ position: { x: 180, y: 180 } });
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.insertText(mainTex);
  await expect(page.getByText("PREVIEW STALE")).toBeVisible();
  const recompile = page.getByRole("button", { name: "Recompile" });
  await recompile.click();
  await expect(page.getByText("PREVIEW STALE")).toHaveCount(0, { timeout: 150_000 });
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
});
