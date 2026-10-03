import { requireUser } from "@/lib/auth";
import { ShadowTrainer } from "@/components/ShadowTrainer";

export const dynamic = "force-dynamic";

export default async function ShadowPage() {
  const me = await requireUser();
  return <ShadowTrainer level={me.level} />;
}
