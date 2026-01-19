import { requireAdmin } from "@/lib/auth-helpers";
import AdminScansClient from "./scans-client";
import { getAllScans } from "@/app/actions/scans";

export default async function AdminScansPage() {
  await requireAdmin();

  const scans = await getAllScans();

  return <AdminScansClient scans={scans} />;
}
