import { RolePlay } from "@/components/RolePlay";

export const dynamic = "force-dynamic";

export default async function RolePlayPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const sp = await searchParams;
  return <RolePlay starter={sp.s} />;
}
