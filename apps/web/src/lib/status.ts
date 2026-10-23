export type ServiceStatus = "ready" | "offline" | "planned";

export function statusLabel(status: ServiceStatus): string {
  const labels: Record<ServiceStatus, string> = {
    ready: "Scaffold ready",
    offline: "Local service not checked",
    planned: "Later group",
  };
  return labels[status];
}

