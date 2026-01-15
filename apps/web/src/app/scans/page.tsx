import { auth } from "@phish-guard-app/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ScansClient from "./scans-client";
import { getMyScans } from "@/app/actions/scans";

export default async function ScansPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const scans = await getMyScans();

  return <ScansClient scans={scans} />;
}
