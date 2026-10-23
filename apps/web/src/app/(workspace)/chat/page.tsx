import { ChatWorkspace } from "@/components/workspace/chat-workspace";
import { findSample } from "@/lib/samples";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ sample?: string | string[] }>;
}) {
  const params = await searchParams;
  const requested = typeof params.sample === "string" ? params.sample : undefined;
  return <ChatWorkspace sampleId={findSample(requested)?.id} />;
}
