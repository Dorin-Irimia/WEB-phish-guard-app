import { redirect } from "next/navigation";
import { checkAdminExists } from "@/app/actions/setup";
import SetupAdminForm from "./setup-admin-form";

export default async function SetupPage() {
  // Check if admin already exists
  const adminExists = await checkAdminExists();

  // If admin exists, redirect to login
  if (adminExists) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-blue-600 rounded-full mb-4">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            PhishGuard Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create your admin account to get started
          </p>
        </div>

        <SetupAdminForm />

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>This page is only accessible for initial setup.</p>
          <p className="mt-1">Once an admin is created, it will be disabled.</p>
        </div>
      </div>
    </div>
  );
}
