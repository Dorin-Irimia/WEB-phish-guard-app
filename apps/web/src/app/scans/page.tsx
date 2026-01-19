import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";
import ScansClient from "./scans-client";
import { getMyScans } from "@/app/actions/scans";

export default async function ScansPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const scans = await getMyScans();

  return <ScansClient scans={scans} />;
}
