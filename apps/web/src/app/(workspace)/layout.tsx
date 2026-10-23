import { WorkspaceShell } from "@/components/workspace/workspace-shell";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
