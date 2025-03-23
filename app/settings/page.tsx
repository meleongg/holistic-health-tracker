"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

    try {
      await setDoc(doc(db, "userProfiles", user.uid), userProfile);
      toast.success("Your preferences have been saved");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save your preferences");
    }
  };

  if (loading) {
    return <div>Loading your preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email} disabled />
            <p className="text-xs text-muted-foreground mt-1">
              This is the email address you signed up with
            </p>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number (optional)</Label>
            <Input
              id="phone"
              placeholder="+1 (123) 456-7890"
              value={userProfile.phoneNumber}
              onChange={(e) =>
                setUserProfile({ ...userProfile, phoneNumber: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              For SMS reminders (coming soon)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* <Card>
        <CardHeader>
          <CardTitle>Reminder Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Receive email reminders about incomplete treatments
              </p>
            </div>
            <Switch
              checked={userProfile.enableEmailReminders}
              onCheckedChange={(checked) =>
                setUserProfile({
                  ...userProfile,
                  enableEmailReminders: checked,
                })
              }
            />
          </div>

          <div className="space-y-3">
            <Label>Reminder Time</Label>
            <TimeInput
              value={userProfile.reminderTime}
              onChange={(value) =>
                setUserProfile({ ...userProfile, reminderTime: value })
              }
            />
            <p className="text-sm text-muted-foreground">
              Time of day to receive reminders
            </p>
          </div>

          <div className="space-y-3">
            <Label>Reminder Frequency</Label>
            <RadioGroup
              value={userProfile.reminderFrequency}
              onValueChange={(value) =>
                setUserProfile({ ...userProfile, reminderFrequency: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily">Daily</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="missed-only" id="missed-only" />
                <Label htmlFor="missed-only">Only for missed treatments</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly">Weekly summary only</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Summary</Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your treatment adherence
              </p>
            </div>
            <Switch
              checked={userProfile.enableEndOfWeekReminders}
              onCheckedChange={(checked) =>
                setUserProfile({
                  ...userProfile,
                  enableEndOfWeekReminders: checked,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Monthly Report</Label>
              <p className="text-sm text-muted-foreground">
                Receive a monthly report with treatment effectiveness statistics
              </p>
            </div>
            <Switch
              checked={userProfile.enableEndOfMonthSummary}
              onCheckedChange={(checked) =>
                setUserProfile({
                  ...userProfile,
                  enableEndOfMonthSummary: checked,
                })
              }
            />
          </div>

          <Button onClick={saveUserProfile}>Save Preferences</Button>
        </CardContent>
      </Card> */}

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Reminder Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center">
            <p className="text-muted-foreground">
              Email and SMS reminders are coming soon!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You'll be able to set up reminders for treatments and receive
              weekly/monthly reports.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
