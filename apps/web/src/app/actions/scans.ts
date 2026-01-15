"use server";

import prisma from "@phish-guard-app/db";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

// Get user's own scans
export async function getMyScans() {
  const session = await requireAuth();

  const scans = await prisma.scan.findMany({
    where: {
      userId: session.user.id,
      isDeleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return scans;
}

// Get single scan by ID (user can only see their own)
export async function getScanById(scanId: string) {
  const session = await requireAuth();

  const scan = await prisma.scan.findFirst({
    where: {
      id: scanId,
      userId: session.user.id,
      isDeleted: false,
    },
  });

  if (!scan) {
    throw new Error("Scan not found");
  }

  return scan;
}

// Delete own scan (soft delete)
export async function deleteScan(scanId: string) {
  const session = await requireAuth();

  const scan = await prisma.scan.findFirst({
    where: {
      id: scanId,
      userId: session.user.id,
    },
  });

  if (!scan) {
    throw new Error("Scan not found");
  }

  await prisma.scan.update({
    where: { id: scanId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: session.user.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/scans");
  return { success: true };
}

// ADMIN: Get all scans
export async function getAllScans() {
  await requireAdmin();

  const scans = await prisma.scan.findMany({
    where: {
      isDeleted: false,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return scans;
}

// ADMIN: Delete any scan
export async function adminDeleteScan(scanId: string) {
  const session = await requireAdmin();

  await prisma.scan.update({
    where: { id: scanId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: session.user.id,
    },
  });

  revalidatePath("/admin/scans");
  return { success: true };
}

// ADMIN: Get all users
export async function getAllUsers() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          scans: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return users;
}

// ADMIN: Update user role
export async function updateUserRole(userId: string, role: "user" | "admin") {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

// ADMIN: Get dashboard stats
export async function getAdminStats() {
  await requireAdmin();

  const [totalUsers, totalScans, threatsDetected, recentScans] = await Promise.all([
    prisma.user.count(),
    prisma.scan.count({ where: { isDeleted: false } }),
    prisma.scan.count({ where: { isPhishing: true, isDeleted: false } }),
    prisma.scan.findMany({
      where: { isDeleted: false },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
  ]);

  return {
    totalUsers,
    totalScans,
    threatsDetected,
    safeScans: totalScans - threatsDetected,
    recentScans,
  };
}
