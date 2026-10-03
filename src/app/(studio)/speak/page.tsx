import { requireUser } from "@/lib/auth";
import { SpeakLab } from "@/components/SpeakLab";

export const dynamic = "force-dynamic";

export default async function SpeakPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  return <SpeakLab level={me.level} initialTopicId={sp.topic} />;
}
