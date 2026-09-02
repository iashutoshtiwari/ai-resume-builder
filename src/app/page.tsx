import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ImportScreen } from "@/features/import/import-screen";

export default async function HomePage() {
  const canonicalLatex = await readFile(resolve(process.cwd(), "main.tex"), "utf8");
  const aiConfigured = Boolean(
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );
  return <ImportScreen canonicalLatex={canonicalLatex} aiConfigured={aiConfigured} />;
}
