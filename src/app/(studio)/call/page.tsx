import { requireUser } from "@/lib/auth";
import { CallRoom } from "@/components/CallRoom";

export const dynamic = "force-dynamic";

export default async function CallPage({ searchParams }: { searchParams: Promise<{ join?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  return <CallRoom me={{ id: me.id, name: me.name, level: me.level }} autoJoin={sp.join ? String(sp.join).toUpperCase() : undefined} />;
}
