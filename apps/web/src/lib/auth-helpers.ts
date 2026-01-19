import { auth } from "@phish-guard-app/auth";
import { headers } from "next/headers";

/**
 * Get the current session without requiring authentication
 * @returns Session object or null if not authenticated
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Require user authentication, throw error if not authenticated
 * @throws Error if user is not authenticated
 * @returns Session object
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Unauthorized - Please login");
  }

  return session;
}

/**
 * Require admin role, throw error if user is not admin
 * @throws Error if user is not authenticated or not admin
 * @returns Session object
 */
export async function requireAdmin() {
  const session = await requireAuth();

  if (session.user.role !== "admin") {
    throw new Error("Forbidden - Admin access required");
  }

  return session;
}

/**
 * Check if a role is admin
 * @param role - User role to check
 * @returns true if role is admin
 */
export function isAdmin(role?: string) {
  return role === "admin";
}

/**
 * Get current year for copyright notices
 * @returns Current year as number
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}
