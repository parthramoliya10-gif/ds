"use client";

import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import supabase from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import {
  User as UserIcon,
  Mail,
  Lock,
  Camera,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  School,
  GraduationCap,
  Briefcase,
  Phone,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

interface ProfileViewProps {
  role?: "student" | "admin";
}

// Curated high-res academic and professional preset avatars
const PRESET_AVATARS = [
  {
    name: "Scholar 1",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  },
  {
    name: "Scholar 2",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  },
  {
    name: "Scholar 3",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
  },
  {
    name: "Scholar 4",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
  },
  {
    name: "Scholar 5",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
  },
  {
    name: "Scholar 6",
    url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
  },
];

export function ProfileView({ role = "student" }: ProfileViewProps) {
  const { user, updateProfile, updateEmail, updatePassword } = useAuth();

  // Active sub-tab
  const [activeTab, setActiveTab] = React.useState("general");

  // Form states: General info
  const [fullName, setFullName] = React.useState(user?.name || "");
  const [phone, setPhone] = React.useState(user?.phone || "");
  const [college, setCollege] = React.useState(user?.college || "ppsu");
  const [semester, setSemester] = React.useState(String(user?.semester || "4"));
  const [savingGeneral, setSavingGeneral] = React.useState(false);

  // Form states: Avatar
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatar || "");
  const [customUrlInput, setCustomUrlInput] = React.useState("");
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
      setCollege(user.college || "ppsu");
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

  // 1. Handle General Profile Update
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error("Full name must be at least 2 characters.");
      return;
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

  // 2. Handle Avatar Update
  const handleApplyPresetAvatar = async (url: string) => {
    setSavingAvatar(true);
    try {
      await updateProfile({ avatarUrl: url });
      setAvatarUrl(url);
      toast.success("Profile picture updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile picture.");
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleApplyCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;

    try {
      new URL(customUrlInput.trim());
    } catch {
      toast.error("Please enter a valid image URL starting with http:// or https://");
      return;
    }

    setSavingAvatar(true);
    try {
      await updateProfile({ avatarUrl: customUrlInput.trim() });
      setAvatarUrl(customUrlInput.trim());
      setCustomUrlInput("");
      toast.success("Profile picture updated from URL!");
    } catch (err: any) {
      toast.error(err.message || "Failed to apply profile picture.");
    } finally {
      setSavingAvatar(false);
    }
  };

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
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        // In local state, apply immediately for avatar preview
        await updateProfile({ avatarUrl: base64 });
        setAvatarUrl(base64);
        toast.success("Profile photo uploaded successfully!");
      } catch (err: any) {
        toast.error(err.message || "Failed to save profile picture.");
      } finally {
        setSavingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetAvatar = async () => {
    setSavingAvatar(true);
    try {
      await updateProfile({ avatarUrl: "" });
      setAvatarUrl("");
      toast.success("Profile photo reset to default initials!");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset profile picture.");
    } finally {
      setSavingAvatar(false);
    }
  };

  // 3. Handle Email Update
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

  // 4. Handle Password Update
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
        title={role === "admin" ? "Admin Profile & Credentials" : "My Student Profile & Settings"}
        description={
          role === "admin"
            ? "Manage your administrative coordinator credentials, communication preferences, and security keys."
            : "Update your student identity, college affiliation, contact details, and account security."
        }
      />

      {/* Top Profile Summary Card */}
      <Card className="rounded-[8px] border border-border bg-background shadow-none overflow-hidden">
        <div className="h-24 bg-surface border-b border-border flex items-end px-6 pb-3 justify-between">
          <Badge variant="outline" className="text-[11px] font-mono bg-background">
            {role === "admin" ? "Role: Administrator" : "Role: Student"}
          </Badge>
          <span className="text-[11px] text-muted-foreground font-mono">
            User ID: {user?.id.substring(0, 12)}...
          </span>
        </div>

        <CardContent className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 mb-4">
            <div className="flex items-end space-x-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 rounded-full border-4 border-background shadow-md bg-surface">
                  <AvatarImage src={avatarUrl || user?.avatar} alt={user?.name || "User"} />
                  <AvatarFallback className="text-[24px] font-bold bg-foreground text-background">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 shadow transition-opacity"
                  title="Upload profile picture"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-0.5 pb-1">
                <h2 className="text-[22px] font-bold text-foreground tracking-tight">
                  {user?.name || "User Account"}
                </h2>
                <div className="flex items-center space-x-2 text-[13px] text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{user?.email || "No email"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {avatarUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetAvatar}
                  disabled={savingAvatar}
                  className="text-[12px] h-9 border-border text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset Picture
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={savingAvatar}
                className="text-[12px] h-9 border-border"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Change Picture
              </Button>
            </div>
          </div>

          {/* Quick Academic Details Pill */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-[6px] bg-surface border border-border text-[12px] mt-2">
            <div>
              <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                {role === "admin" ? "Department" : "College"}
              </span>
              <span className="font-semibold text-foreground truncate block">
                {user?.college || (role === "admin" ? "Operations" : "ppsu")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                {role === "admin" ? "Access Level" : "Semester"}
              </span>
              <span className="font-semibold text-foreground">
                {role === "admin" ? "Full Operations" : `Semester ${user?.semester || "4"}`}
              </span>
            </div>
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

      {/* Tabbed Settings */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full sm:w-auto flex items-center justify-start overflow-x-auto no-scrollbar h-11 border border-border bg-surface p-1">
          <TabsTrigger value="general" className="text-[13px] px-4 shrink-0">
            <UserIcon className="h-3.5 w-3.5 mr-2" />
            Personal Details
          </TabsTrigger>
          <TabsTrigger value="avatar" className="text-[13px] px-4 shrink-0">
            <Camera className="h-3.5 w-3.5 mr-2" />
            Profile Picture
          </TabsTrigger>
          <TabsTrigger value="email" className="text-[13px] px-4 shrink-0">
            <Mail className="h-3.5 w-3.5 mr-2" />
            Email Address
          </TabsTrigger>
          <TabsTrigger value="security" className="text-[13px] px-4 shrink-0">
            <Lock className="h-3.5 w-3.5 mr-2" />
            Password &amp; Security
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: PERSONAL DETAILS                                                   */}
        {/* ========================================================================= */}
        <TabsContent value="general" className="space-y-6">
          <Card className="rounded-[8px] border border-border bg-background shadow-none p-6 space-y-6">
            <div className="border-b border-border pb-3">
              <CardTitle className="text-[18px] font-bold text-foreground">
                Personal &amp; Contact Details
              </CardTitle>
              <CardDescription className="text-[13px] text-muted-foreground">
                {role === "admin"
                  ? "Update your administrative contact name, department, and phone."
                  : "Update your full name, university name, academic semester, and phone number."}
              </CardDescription>
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
                    placeholder="Enter full name"
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

                {/* College or Department */}
                <div className="space-y-1.5">
                  <Label htmlFor="college" className="text-[13px] font-medium">
                    {role === "admin" ? "Department" : "College / University Name"}
                  </Label>
                  <Input
                    id="college"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder={role === "admin" ? "e.g. Academic Operations" : "e.g. ppsu, DTU, VIT"}
                    className="h-10 text-[14px]"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {role === "admin"
                      ? "Administrative desk unit."
                      : "Used by specialists to format covers and lab rubrics."}
                  </p>
                </div>

                {/* Semester or Role Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="semester" className="text-[13px] font-medium">
                    {role === "admin" ? "Title / Position" : "Current Semester (1 – 8)"}
                  </Label>
                  <Input
                    id="semester"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder={role === "admin" ? "Senior Coordinator" : "e.g. 4"}
                    className="h-10 text-[14px]"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {role === "admin"
                      ? "Operational role designation."
                      : "Current academic semester level."}
                  </p>
                </div>
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
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: PROFILE PICTURE (AVATAR)                                           */}
        {/* ========================================================================= */}
        <TabsContent value="avatar" className="space-y-6">
          <Card className="rounded-[8px] border border-border bg-background shadow-none p-6 space-y-6">
            <div className="border-b border-border pb-3">
              <CardTitle className="text-[18px] font-bold text-foreground">
                Profile Photo &amp; Avatar
              </CardTitle>
              <CardDescription className="text-[13px] text-muted-foreground">
                Upload a custom picture from your device, apply an image URL, or choose from high-resolution curated presets.
              </CardDescription>
            </div>

            {/* Current Picture Preview & Actions */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-4 rounded-[8px] bg-surface border border-border">
              <Avatar className="h-20 w-20 rounded-full border-2 border-foreground bg-background shrink-0">
                <AvatarImage src={avatarUrl || user?.avatar} alt={user?.name || "Avatar"} />
                <AvatarFallback className="text-[20px] font-bold bg-foreground text-background">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <h4 className="text-[15px] font-semibold text-foreground">
                  Current Profile Picture
                </h4>
                <p className="text-[12px] text-muted-foreground max-w-md">
                  {avatarUrl
                    ? "Custom profile photo is active. You can replace it anytime or reset to default initials."
                    : "Default initials avatar is active. Choose a preset below or upload a photo."}
                </p>

                <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                  <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={savingAvatar}
                    className="h-8 text-[12px]"
                  >
                    <Upload className="h-3 w-3 mr-1.5" />
                    Upload from Device
                  </Button>
                  {avatarUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetAvatar}
                      disabled={savingAvatar}
                      className="h-8 text-[12px] border-border"
                    >
                      <RotateCcw className="h-3 w-3 mr-1.5" />
                      Reset to Initials
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Preset Avatars Grid */}
            <div className="space-y-3">
              <div className="space-y-0.5">
                <h4 className="text-[14px] font-semibold text-foreground">
                  Curated Avatar Gallery
                </h4>
                <p className="text-[12px] text-muted-foreground">
                  Click any avatar below to apply it instantly to your profile.
                </p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {PRESET_AVATARS.map((preset, idx) => {
                  const isSelected = avatarUrl === preset.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPresetAvatar(preset.url)}
                      disabled={savingAvatar}
                      className={`relative rounded-full p-1 border-2 transition-all hover:scale-105 focus:outline-none ${
                        isSelected
                          ? "border-foreground ring-2 ring-foreground/20"
                          : "border-transparent hover:border-border"
                      }`}
                    >
                      <Avatar className="h-16 w-16 mx-auto">
                        <AvatarImage src={preset.url} alt={preset.name} />
                        <AvatarFallback>AV</AvatarFallback>
                      </Avatar>
                      {isSelected && (
                        <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-foreground text-background flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Apply Image by URL */}
            <form onSubmit={handleApplyCustomUrl} className="space-y-3 pt-4 border-t border-border">
              <Label htmlFor="customUrl" className="text-[13px] font-medium">
                Or Use a Direct Image Link
              </Label>
              <div className="flex gap-2">
                <Input
                  id="customUrl"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="h-10 text-[13px]"
                />
                <Button
                  type="submit"
                  disabled={savingAvatar || !customUrlInput.trim()}
                  className="h-10 px-4 text-[13px] shrink-0 font-medium"
                >
                  Apply URL
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: EMAIL ADDRESS                                                      */}
        {/* ========================================================================= */}
        <TabsContent value="email" className="space-y-6">
          <Card className="rounded-[8px] border border-border bg-background shadow-none p-6 space-y-6">
            <div className="border-b border-border pb-3">
              <CardTitle className="text-[18px] font-bold text-foreground">
                Email Address &amp; Verification
              </CardTitle>
              <CardDescription className="text-[13px] text-muted-foreground">
                Your primary college email used for authentication, receipts, and order notifications.
              </CardDescription>
            </div>

            <div className="p-4 rounded-[8px] bg-surface border border-border flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Current Email Address
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
                  New Email Address
                </Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new.email@university.edu"
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
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: PASSWORD & SECURITY                                                */}
        {/* ========================================================================= */}
        <TabsContent value="security" className="space-y-6">
          <Card className="rounded-[8px] border border-border bg-background shadow-none p-6 space-y-6">
            <div className="border-b border-border pb-3">
              <CardTitle className="text-[18px] font-bold text-foreground">
                Password &amp; Account Security
              </CardTitle>
              <CardDescription className="text-[13px] text-muted-foreground">
                Set a secure password for signing in. We recommend a combination of uppercase, lowercase, numbers, and symbols.
              </CardDescription>
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
                  placeholder="Minimum 6 characters"
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
                  placeholder="Repeat new password"
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
                If you suspect unauthorized activity or forgot your current password on another device, you can also dispatch a password reset link to your email inbox.
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
