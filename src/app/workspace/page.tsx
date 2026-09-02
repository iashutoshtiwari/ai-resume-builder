import { WorkspaceShell } from "@/features/workspace/workspace-shell";

export default function WorkspacePage() {
  const aiConfigured = Boolean(
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );
  return <WorkspaceShell aiConfigured={aiConfigured} />;
}

