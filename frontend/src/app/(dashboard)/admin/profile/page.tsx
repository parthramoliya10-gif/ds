import * as React from "react";
import { Metadata } from "next";
import { ProfileView } from "@/components/profile/ProfileView";

export const metadata: Metadata = {
  title: "Admin Profile & Credentials — DSMS",
  description: "Update administrator name, email, password, and profile picture avatar.",
};

export default function AdminProfilePage() {
  return <ProfileView role="admin" />;
}
