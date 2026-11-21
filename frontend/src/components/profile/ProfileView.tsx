"use client";

import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import supabase from "@/lib/supabase/client";
import api from "@/lib/api/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import {
  User as UserIcon,
  Mail,
  Lock,
  Camera,
  CheckCircle2,
  ShieldCheck,
  X,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { formatShortId } from "@/lib/utils";

interface ProfileViewProps {
  role?: "student" | "admin";
}

export function ProfileView({ role = "student" }: ProfileViewProps) {
  const { user, updateProfile, updateEmail, updatePassword } = useAuth();

  // Form states: General info
  const [fullName, setFullName] = React.useState(user?.name || "");
  const [phone, setPhone] = React.useState(user?.phone || "");
  const [college, setCollege] = React.useState(user?.college || "");
  const [semester, setSemester] = React.useState(String(user?.semester || "4"));
  const [savingGeneral, setSavingGeneral] = React.useState(false);

  // Form states: Avatar
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatar || "");
  const [savingAvatar, setSavingAvatar] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Form states: Email
  const [newEmail, setNewEmail] = React.useState("");
  const [savingEmail, setSavingEmail] = React.useState(false);

  // Form states: Password
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [savingPassword, setSavingPassword] = React.useState(false);

  // Sync state if user changes
  React.useEffect(() => {
    if (user) {
      setFullName(user.name || "");
      setPhone(user.phone || "");
      setCollege(user.college || "");
      setSemester(String(user.semester || "4"));
      setAvatarUrl(user.avatar || "");
    }
  }, [user]);

  // Initials fallback
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || (role === "admin" ? "AD" : "ST");

  const hasPhoto = Boolean(avatarUrl || user?.avatar);

  // 1. Handle General Profile Update
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error("Full name must be at least 2 characters.");
      return;
    }

    if (phone.trim() && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/.test(phone.trim())) {
      toast.error("Please enter a valid phone number (at least 10 digits).");
      return;
    }

    if (role === "student" && semester.trim()) {
      const semNum = parseInt(semester.trim(), 10);
      if (isNaN(semNum) || semNum < 1 || semNum > 12) {
        toast.error("Semester must be a valid number between 1 and 12.");
        return;
      }
    }

    setSavingGeneral(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        college: role === "student" ? college.trim() : undefined,
        semester: role === "student" ? parseInt(semester, 10) || 1 : undefined,
      });
      toast.success("Profile details updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile details.");
    } finally {
      setSavingGeneral(false);
    }
  };

  // 2. Handle File Upload for Avatar via Cloudinary
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5 MB.");
      return;
    }

    setSavingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.profile.uploadAvatar(formData);
      if (res && res.avatarUrl) {
        setAvatarUrl(res.avatarUrl);
        await updateProfile({ avatarUrl: res.avatarUrl });
        toast.success("Profile photo updated successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload profile photo.");
    } finally {
      setSavingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 3. Handle Reset / Remove Avatar (Click on X sign)
  const handleResetAvatar = async () => {
    setSavingAvatar(true);
    try {
      try {
        await api.profile.removeAvatar();
      } catch (err) {
        console.warn("Backend removeAvatar skipped:", err);
      }
      await updateProfile({ avatarUrl: "" });
      setAvatarUrl("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("Profile photo removed!");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove profile photo.");
    } finally {
      setSavingAvatar(false);
    }
  };

  // 4. Handle Email Update
  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (newEmail.trim().toLowerCase() === user?.email.toLowerCase()) {
      toast.info("This is already your current registered email.");
      return;
    }

    setSavingEmail(true);
    try {
      await updateEmail(newEmail.trim());
      toast.success(
        "Confirmation link sent! Please check both your current and new inbox to confirm the change."
      );
      setNewEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update email address.");
    } finally {
      setSavingEmail(false);
    }
  };

  // 5. Handle Password Update
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match. Please verify.");
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword(newPassword);
      toast.success("Password updated successfully! Keep your new credentials safe.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <PageHeader
        title={role === "admin" ? "Admin Profile & Settings" : "My Student Profile & Settings"}
        description={
          role === "admin"
            ? "Manage your administrative coordinator credentials, communication preferences, and security."
            : "Update your student identity, organization affiliation, contact details, and account security."
        }
      />

      {/* ========================================================================= */}
      {/* 1. TOP PROFILE SUMMARY CARD (AVATAR WITH X & CAMERA ON BORDER)             */}
      {/* ========================================================================= */}
      <Card className="rounded-[8px] border border-border bg-background shadow-none overflow-hidden">
        <div className="h-24 bg-surface border-b border-border flex items-center px-6 justify-end">
          <span className="text-[11px] text-muted-foreground font-mono font-medium">
            {role === "admin" ? "Admin ID" : "User ID"}: {formatShortId(user?.id, role === "admin" ? "ADM" : "USR")}
          </span>
        </div>

        <CardContent className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 mb-4">
            <div className="flex items-end space-x-4">
              {/* Circular Avatar Container with Border X Sign and Camera */}
              <div className="relative group">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer relative"
                  title="Click to upload or change profile photo"
                >
                  <Avatar className="h-24 w-24 rounded-full border-4 border-background shadow-md bg-surface overflow-hidden">
                    <AvatarImage
                      src={avatarUrl || user?.avatar}
                      alt={user?.name || "User"}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-[24px] font-bold bg-foreground text-background">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Hover Camera Overlay */}
                  <div className="absolute inset-0 rounded-full bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="h-5 w-5" />
                  </div>
                </div>

                {/* X Sign on border to remove photo */}
                {hasPhoto && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetAvatar();
                    }}
                    disabled={savingAvatar}
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md border-2 border-background transition-transform hover:scale-110 z-20 cursor-pointer"
                    title="Remove profile photo"
                  >
                    <X className="h-3.5 w-3.5 stroke-[2.5]" />
                  </button>
                )}

                {/* Camera upload button on bottom-right border */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={savingAvatar}
                  className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 shadow-md border-2 border-background transition-transform hover:scale-110 z-10 cursor-pointer"
                  title="Upload profile photo"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-0.5 pb-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-[22px] font-bold text-foreground tracking-tight">
                    {user?.name || "User Account"}
                  </h2>
                  <Badge variant="outline" className="text-[11px] font-mono bg-surface">
                    {role === "admin" ? "Administrator" : "Student"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-[13px] text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{user?.email || "No email"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={savingAvatar}
                className="text-[12px] h-9 border-border"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload Photo
              </Button>
            </div>
          </div>

          {/* Quick Details Pill: Department & Title removed for Admin */}
          <div
            className={`grid gap-3 p-3.5 rounded-[6px] bg-surface border border-border text-[12px] mt-2 ${
              role === "admin" ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
            }`}
          >
            {role === "student" && (
              <>
                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                    Organization Name
                  </span>
                  <span className="font-semibold text-foreground truncate block">
                    {user?.college || "Organization Name"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                    Current Semester
                  </span>
                  <span className="font-semibold text-foreground">
                    Semester {user?.semester || "4"}
                  </span>
                </div>
              </>
            )}

            {role === "admin" && (
              <div>
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                  Access Level
                </span>
                <span className="font-semibold text-foreground">
                  Full Operations (Admin)
                </span>
              </div>
            )}

            <div>
              <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                Phone
              </span>
              <span className="font-semibold text-foreground font-mono">
                {user?.phone || "+91 (Not Provided)"}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                Account Status
              </span>
              <span className="font-semibold text-foreground flex items-center">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-foreground" />
                Active &amp; Verified
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden File Input for Direct Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ========================================================================= */}
      {/* 2. PERSONAL & CONTACT DETAILS SECTION                                      */}
      {/* ========================================================================= */}
      <Card className="rounded-[8px] border border-border bg-background shadow-none p-6 space-y-6">
        <div className="border-b border-border pb-3 flex items-center space-x-2">
          <UserIcon className="h-4 w-4 text-foreground" />
          <div>
            <CardTitle className="text-[18px] font-bold text-foreground">
              Personal &amp; Contact Details
            </CardTitle>
            <CardDescription className="text-[13px] text-muted-foreground">
              {role === "admin"
                ? "Update your administrative contact name and phone number."
                : "Update your full name, organization name, academic semester, and phone number."}
            </CardDescription>
          </div>
        </div>

        <form onSubmit={handleSaveGeneral} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-[13px] font-medium">
                Full Name
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="h-10 text-[14px]"
              />
              <p className="text-[11px] text-muted-foreground">
                This name appears on quotations, orders, and chat messages.
              </p>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-[13px] font-medium">
                Phone / WhatsApp Number
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="h-10 text-[14px]"
              />
              <p className="text-[11px] text-muted-foreground">
                Used for urgent milestone and delivery notifications.
              </p>
            </div>

            {/* College & Semester ONLY for student (Department & Title removed for Admin) */}
            {role === "student" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="college" className="text-[13px] font-medium">
                    Organization Name
                  </Label>
                  <Input
                    id="college"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Stanford University / Tech Corp"
                    className="h-10 text-[14px]"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Used by specialists to format covers and task rubrics.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="semester" className="text-[13px] font-medium">
                    Current Semester (1 – 8)
                  </Label>
                  <Input
                    id="semester"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="e.g. 4"
                    className="h-10 text-[14px]"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Current academic semester level.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={savingGeneral} className="h-10 px-6 font-medium text-[13px]">
              {savingGeneral ? (
                <span className="flex items-center">
                  <span className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                  Saving changes...
                </span>
              ) : (
                <span>Save Personal Details</span>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* ========================================================================= */}
      {/* 3. EMAIL ADDRESS & VERIFICATION SECTION                                    */}
      {/* ========================================================================= */}
      <Card className="rounded-[8px] border border-border bg-background shadow-none p-6 space-y-6">
        <div className="border-b border-border pb-3 flex items-center space-x-2">
          <Mail className="h-4 w-4 text-foreground" />
          <div>
            <CardTitle className="text-[18px] font-bold text-foreground">
              Email Address &amp; Verification
            </CardTitle>
            <CardDescription className="text-[13px] text-muted-foreground">
              Your registered email used for account authentication, receipts, and order notifications.
            </CardDescription>
          </div>
        </div>

        <div className="p-4 rounded-[8px] bg-surface border border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Current Registered Email
            </span>
            <span className="text-[15px] font-mono font-semibold text-foreground">
              {user?.email}
            </span>
          </div>
          <Badge variant="outline" className="text-[11px] font-medium flex items-center bg-background">
            <ShieldCheck className="h-3.5 w-3.5 mr-1 text-foreground" />
            Verified
          </Badge>
        </div>

        <form onSubmit={handleSaveEmail} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="newEmail" className="text-[13px] font-medium">
              Update Email Address
            </Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new.email@example.com"
              className="h-10 text-[14px]"
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              When you submit a new email, a verification link will be sent by Supabase. Click the link to finalize your new email.
            </p>
          </div>

          <Button
            type="submit"
            disabled={savingEmail || !newEmail.trim()}
            className="h-10 px-6 font-medium text-[13px]"
          >
            {savingEmail ? (
              <span className="flex items-center">
                <span className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                Sending confirmation...
              </span>
            ) : (
              <span>Update Email Address</span>
            )}
          </Button>
        </form>
      </Card>

      {/* ========================================================================= */}
      {/* 4. PASSWORD & ACCOUNT SECURITY SECTION                                     */}
      {/* ========================================================================= */}
      <Card className="rounded-[8px] border border-border bg-background shadow-none p-6 space-y-6">
        <div className="border-b border-border pb-3 flex items-center space-x-2">
          <Lock className="h-4 w-4 text-foreground" />
          <div>
            <CardTitle className="text-[18px] font-bold text-foreground">
              Password &amp; Account Security
            </CardTitle>
            <CardDescription className="text-[13px] text-muted-foreground">
              Set a secure password for signing in. We recommend a combination of uppercase, lowercase, numbers, and symbols.
            </CardDescription>
          </div>
        </div>

        <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
          {/* New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-[13px] font-medium">
              New Password
            </Label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="h-10 text-[14px]"
            />
            <PasswordStrengthMeter password={newPassword} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-[13px] font-medium">
              Confirm New Password
            </Label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className="h-10 text-[14px]"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={savingPassword || !newPassword}
              className="h-10 px-6 font-medium text-[13px]"
            >
              {savingPassword ? (
                <span className="flex items-center">
                  <span className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                  Updating password...
                </span>
              ) : (
                <span>Update Password</span>
              )}
            </Button>
          </div>
        </form>

        <div className="p-4 rounded-[8px] bg-surface border border-border space-y-2">
          <h4 className="text-[13px] font-semibold text-foreground flex items-center">
            <ShieldCheck className="h-4 w-4 mr-1.5 text-foreground" />
            Session Security
          </h4>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            If you suspect unauthorized activity or forgot your current password on another device, you can dispatch a password reset link to your email inbox.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                if (!user?.email) {
                  toast.error("User email is not available.");
                  return;
                }
                const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) throw error;
                toast.success(`Password reset instructions dispatched to ${user.email}`);
              } catch (err: any) {
                toast.error(err.message || "Failed to dispatch reset link.");
              }
            }}
            className="text-[12px] h-8 border-border"
          >
            Send Password Reset Email
          </Button>
        </div>
      </Card>
    </div>
  );
}
