import { requireUser } from "@/lib/auth";
import { GrammarCamp } from "@/components/GrammarCamp";

export const dynamic = "force-dynamic";

export default async function GrammarPage() {
  const me = await requireUser();
  return <GrammarCamp level={me.level} />;
}
