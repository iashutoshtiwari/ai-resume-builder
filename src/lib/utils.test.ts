import { describe, expect, it } from "vitest";
import { createId, hashText, sanitizeFilename } from "@/lib/utils";

describe("workspace utilities", () => {
  it("creates unique prefixed stable IDs", () => {
    const first = createId("bullet");
    const second = createId("bullet");
    expect(first).toMatch(/^bullet-/);
    expect(second).not.toBe(first);
  });

  it("sanitizes export filenames", () => {
    expect(sanitizeFilename("Zoë / Résumé: ACME.pdf")).toBe("zoe-resume-acme-pdf");
    expect(sanitizeFilename("***")).toBe("resume");
  });

  it("hashes source deterministically", async () => {
    await expect(hashText("same source")).resolves.toBe(await hashText("same source"));
    expect(await hashText("same source")).not.toBe(await hashText("changed source"));
  });
});
