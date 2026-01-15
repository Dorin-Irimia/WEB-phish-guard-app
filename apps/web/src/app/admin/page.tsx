import { auth } from "@phish-guard-app/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-helpers";
import AdminDashboard from "./admin-dashboard";
import { getAdminStats } from "@/app/actions/scans";

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  if (!isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  const stats = await getAdminStats();

  return <AdminDashboard stats={stats} />;
}
