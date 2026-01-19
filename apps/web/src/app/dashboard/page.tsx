import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { getSession } from "@/lib/auth-helpers";
import { getUserStats, getAdminStats } from "@/app/actions/scans";
import Dashboard from "./dashboard";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";
  const stats = isAdmin ? await getAdminStats() : await getUserStats();

  return <Dashboard session={session} stats={stats} />;
}
