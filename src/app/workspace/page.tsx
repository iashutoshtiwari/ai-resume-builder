import { WorkspaceShell } from "@/features/workspace/workspace-shell";
import { isAiConfigured } from "@/lib/ai/factory";

export default function WorkspacePage() {
  const aiConfigured = isAiConfigured();
  return <WorkspaceShell aiConfigured={aiConfigured} />;
}
