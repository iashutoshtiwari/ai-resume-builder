import { describe, expect, it } from "vitest";
import { hashCompileInput } from "@/features/latex/source-hash";

describe("hashCompileInput", () => {
  it("changes when source or a project file changes and ignores file order", async () => {
    const first = { id: "one", name: "custom.sty", content: new Uint8Array([1, 2, 3]) };
    const second = { id: "two", name: "font.tfm", content: new Uint8Array([4, 5]) };
    expect(await hashCompileInput("source", [first, second])).toBe(await hashCompileInput("source", [second, first]));
    expect(await hashCompileInput("source", [first])).not.toBe(await hashCompileInput("changed", [first]));
    expect(await hashCompileInput("source", [first])).not.toBe(await hashCompileInput("source", [{ ...first, content: new Uint8Array([1, 2, 4]) }]));
  });
});
