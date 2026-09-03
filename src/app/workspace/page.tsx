import type { Metadata } from "next";
import { WorkspaceShell } from "@/features/workspace/workspace-shell";
import { isAiConfigured } from "@/lib/ai/factory";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Interactive resume tailoring and LaTeX review desk.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function WorkspacePage() {
  const aiConfigured = isAiConfigured();
  return <WorkspaceShell aiConfigured={aiConfigured} />;
}
