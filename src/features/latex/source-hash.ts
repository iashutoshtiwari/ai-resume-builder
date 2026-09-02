import type { LatexProjectFile } from "@/features/workspace/schema";
import { hashText } from "@/lib/utils";

export async function hashCompileInput(source: string, files: LatexProjectFile[]): Promise<string> {
  const fileDigests = await Promise.all(
    [...files]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(async (file) => ({
        name: file.name,
        digest: Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", file.content)))
          .map((value) => value.toString(16).padStart(2, "0"))
          .join(""),
      })),
  );
  return hashText(JSON.stringify({ source, files: fileDigests }));
}
