import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import AdminDashboard from "./admin-dashboard";
import { getAdminStats } from "@/app/actions/scans";

export default async function AdminPage() {
  const session = await requireAdmin();

  const stats = await getAdminStats();

  return <AdminDashboard stats={stats} />;
}
