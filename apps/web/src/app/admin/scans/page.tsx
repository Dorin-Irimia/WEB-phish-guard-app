import { auth } from "@phish-guard-app/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-helpers";
import AdminScansClient from "./scans-client";
import { getAllScans } from "@/app/actions/scans";

export default async function AdminScansPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  const scans = await getAllScans();

  return <AdminScansClient scans={scans} />;
}
