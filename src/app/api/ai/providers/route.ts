import { getAvailableAiProviders, resolveAiProvider } from "@/lib/ai/factory";

export const runtime = "nodejs";

export async function GET() {
  const providers = getAvailableAiProviders();
  const defaultProvider = resolveAiProvider();

  return Response.json({
    providers,
    defaultProvider,
  });
}
