import { auth } from "@phish-guard-app/auth";
import { headers } from "next/headers";

export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized - Please login");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();

  if (session.user.role !== "admin") {
    throw new Error("Forbidden - Admin access required");
  }

  return session;
}

export function isAdmin(role?: string) {
  return role === "admin";
}
