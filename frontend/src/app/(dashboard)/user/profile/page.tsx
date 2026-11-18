import * as React from "react";
import { Metadata } from "next";
import { ProfileView } from "@/components/profile/ProfileView";

export const metadata: Metadata = {
  title: "My Student Profile & Settings — DSMS",
  description: "Update student name, email, password, and profile picture avatar.",
};

export default function UserProfilePage() {
  return <ProfileView role="student" />;
}
