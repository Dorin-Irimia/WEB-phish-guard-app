import { requireAdmin } from "@/lib/auth-helpers";
import AdminUsersClient from "./users-client";
import { getAllUsers } from "@/app/actions/scans";

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await getAllUsers();

  return <AdminUsersClient users={users} />;
}
