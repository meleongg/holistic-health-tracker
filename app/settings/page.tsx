"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Bell, Loader2, Mail, Phone, Save, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>({
    reminderTime: "20:00", // Default to 8 PM
    reminderFrequency: "daily",
    enableEmailReminders: true,
    enableEndOfWeekReminders: true,
    enableEndOfMonthSummary: true,
    phoneNumber: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchUserProfile(user.uid);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchUserProfile = async (userId: string) => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "userProfiles", userId));
      if (userDoc.exists()) {
        setUserProfile({ ...userProfile, ...userDoc.data() });
      } else {
        // Create default user profile
        await setDoc(doc(db, "userProfiles", userId), userProfile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to load user preferences");
    } finally {
      setLoading(false);
    }
  };

  const saveUserProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await setDoc(doc(db, "userProfiles", user.uid), userProfile);
      toast.success("Your preferences have been saved");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save your preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-[180px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[120px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
          </CardHeader>
          <CardContent>
            <div className="py-6">
              <Skeleton className="h-4 w-full mx-auto max-w-[300px]" />
              <div className="mt-2">
                <Skeleton className="h-4 w-full mx-auto max-w-[250px]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center">
          <User className="mr-2 h-5 w-5 text-primary hidden sm:inline-block" />
          User Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and notification preferences
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50 pb-4">
          <CardTitle className="flex items-center text-lg">
            <Mail className="mr-2 h-4 w-4 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your basic account details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Input
                id="email"
                value={user?.email || ""} // Add the empty string fallback
                disabled
                className="pl-9 bg-muted/50"
              />
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 pl-1">
              This is the email address you signed up with
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number (optional)
            </Label>
            <div className="relative">
              <Input
                id="phone"
                placeholder="+1 (123) 456-7890"
                value={userProfile.phoneNumber}
                onChange={(e) =>
                  setUserProfile({
                    ...userProfile,
                    phoneNumber: e.target.value,
                  })
                }
                className="pl-9"
              />
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 pl-1">
              For account verification and recovery
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:justify-between gap-3 sm:items-center">
            <p className="text-sm text-muted-foreground order-2 sm:order-1">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <Button
              onClick={saveUserProfile}
              disabled={saving}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-dashed">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="flex items-center text-lg">
            <Bell className="mr-2 h-4 w-4 text-primary" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Set up personalized email reminders for your treatments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Mail className="h-6 w-6 text-primary" />
            </div>

            <div className="max-w-md">
              <h3 className="text-lg font-medium mb-2">Coming Soon!</h3>
              <p className="text-muted-foreground">
                Email reminders are currently in development.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                You'll be able to set up daily, weekly, or monthly email
                notifications for your treatments, as well as receive treatment
                adherence reports and health summaries.
              </p>
            </div>

            <div className="w-full sm:w-auto mt-4">
              <Button variant="outline" className="w-full sm:w-auto" disabled>
                <Bell className="mr-2 h-4 w-4" />
                Notify Me When Available
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional settings card ideas */}
      <Card className="overflow-hidden border-dashed opacity-70 hover:opacity-100 transition-opacity">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="flex items-center text-lg">
            <span className="mr-2 h-4 w-4 inline-block">🔒</span>
            Privacy & Data
          </CardTitle>
          <CardDescription>
            Manage your data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Privacy settings will be available in a future update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
