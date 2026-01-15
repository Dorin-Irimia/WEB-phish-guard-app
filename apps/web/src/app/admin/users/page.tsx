import { auth } from "@phish-guard-app/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-helpers";
import AdminUsersClient from "./users-client";
import { getAllUsers } from "@/app/actions/scans";

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  const users = await getAllUsers();

  return <AdminUsersClient users={users} />;
}
