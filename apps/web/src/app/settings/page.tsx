import { redirect } from "next/navigation";
import { auth } from "@phish-guard-app/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AvatarUpload from "@/components/avatar-upload";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((m) => m.headers()),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your profile picture and personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-4">Profile Picture</h3>
              <AvatarUpload currentImageUrl={session.user.image} />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Email</h3>
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Account Role</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {(session.user as any).role || "user"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your account security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Password</h3>
              <p className="text-sm text-muted-foreground">
                Last changed: Never (Better-Auth handles password management)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
