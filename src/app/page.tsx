import { ImportScreen } from "@/features/import/import-screen";
import { CANONICAL_TEMPLATE_SOURCE } from "@/features/latex/templates/canonical";
import { isAiConfigured } from "@/lib/ai/factory";

export default function HomePage() {
  const aiConfigured = isAiConfigured();
  return <ImportScreen canonicalLatex={CANONICAL_TEMPLATE_SOURCE} aiConfigured={aiConfigured} />;
}
