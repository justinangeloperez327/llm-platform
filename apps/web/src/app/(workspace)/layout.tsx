import { AuthBoundary } from "@/components/auth/auth-boundary";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthBoundary><WorkspaceShell>{children}</WorkspaceShell></AuthBoundary>;
}

