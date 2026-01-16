import { redirect } from "next/navigation";
import { auth } from "@phish-guard-app/auth";
import { getAllUsers } from "@/app/actions/scans";
import { requireAdmin } from "@/lib/auth-helpers";
import CreateUserClient from "./create-user-client";

export default async function AdminCreateUserPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New User</h1>
        <p className="text-muted-foreground">
          Create a new user account and assign their role
        </p>
      </div>

      <CreateUserClient />
    </div>
  );
}
