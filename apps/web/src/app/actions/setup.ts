"use server";

import prisma from "@phish-guard-app/db";
import { auth } from "@phish-guard-app/auth";
import { revalidatePath } from "next/cache";

/**
 * Check if any admin user exists in the system
 */
export async function checkAdminExists(): Promise<boolean> {
  const adminCount = await prisma.user.count({
    where: { role: "admin" },
  });

  return adminCount > 0;
}

/**
 * Create the first admin user - only works if no admin exists
 */
export async function createFirstAdmin(data: {
  email: string;
  password: string;
  name: string;
}) {
  // Double check that no admin exists
  const adminExists = await checkAdminExists();
  
  if (adminExists) {
    throw new Error("An admin user already exists. Please contact your system administrator.");
  }

  // Validate input
  if (!data.email || !data.password || !data.name) {
    throw new Error("All fields are required");
  }

  if (data.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  // Check if email is already taken
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("This email is already registered");
  }

  try {
    // Create user using better-auth API (server-side)
    // This will properly hash the password using better-auth's internal system
    const user = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
    });

    if (!user) {
      throw new Error("Failed to create user");
    }

    // Update the user to admin role
    await prisma.user.update({
      where: { email: data.email },
      data: { 
        role: "admin",
        emailVerified: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/login");
    
    return {
      success: true,
      message: "Admin account created successfully! You can now login.",
    };
  } catch (error: any) {
    console.error("Error creating admin:", error);
    throw new Error(error.message || "Failed to create admin account");
  }
}
