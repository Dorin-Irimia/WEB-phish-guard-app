"use client";

import { useState, useRef } from "react";
import { Upload, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadAvatar } from "@/app/actions/upload";
import { authClient } from "@/lib/auth-client";

export default function AvatarUpload() {
  const { data: session } = authClient.useSession();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(session?.user?.image || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadAvatar(formData);
      setImageUrl(result.imageUrl);
      toast.success("Avatar updated successfully");
      window.location.reload(); // Refresh to show new avatar
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>Upload your avatar (max 5MB)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-12 h-12 text-blue-600" />
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Avatar"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG or GIF (max 5MB)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
