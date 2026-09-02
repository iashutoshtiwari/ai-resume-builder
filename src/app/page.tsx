import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ImportScreen } from "@/features/import/import-screen";
import { isAiConfigured } from "@/lib/ai/factory";

export default async function HomePage() {
  const canonicalLatex = await readFile(resolve(process.cwd(), "main.tex"), "utf8");
  const aiConfigured = isAiConfigured();
  return <ImportScreen canonicalLatex={canonicalLatex} aiConfigured={aiConfigured} />;
}
