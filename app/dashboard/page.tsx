"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch"; // Add this import
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [periodCompletions, setPeriodCompletions] = useState<any[]>([]); // New state for tracking period completions
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAllTreatments, setShowAllTreatments] = useState(false); // New state for toggle
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchTreatments(user.uid);
        fetchDailyCompletions(user.uid);
        fetchPeriodCompletions(user.uid);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router, selectedDate]);

  const fetchTreatments = async (userId: string) => {
    // Existing fetchTreatments function
    const treatmentsQuery = query(
      collection(db, "treatments"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(treatmentsQuery);
    const treatmentsList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setTreatments(treatmentsList);
  };

  const fetchDailyCompletions = async (userId: string) => {
    // Rename the existing fetchCompletions function
    const dateString = selectedDate.toISOString().split("T")[0];

    const completionsQuery = query(
      collection(db, "completions"),
      where("userId", "==", userId),
      where("date", "==", dateString)
    );

    const snapshot = await getDocs(completionsQuery);
    const completionsList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setCompletions(completionsList);
  };

  // New function to fetch all completions for the current period (week/month)
  const fetchPeriodCompletions = async (userId: string) => {
    // Calculate start dates for the current week and month
    const today = selectedDate;
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Convert to strings for Firestore query
    const startOfWeekString = startOfWeek.toISOString().split("T")[0];
    const startOfMonthString = startOfMonth.toISOString().split("T")[0];
    const todayString = today.toISOString().split("T")[0];

    // Query completions since the start of the week
    const periodCompletionsQuery = query(
      collection(db, "completions"),
      where("userId", "==", userId),
      where("date", ">=", startOfMonthString) // We'll filter by week in JavaScript
    );

    const snapshot = await getDocs(periodCompletionsQuery);
    const allCompletions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setPeriodCompletions(allCompletions);
  };

  // New function to determine if a treatment should be shown based on its frequency
  const shouldShowTreatment = (treatment: any) => {
    // If showing all treatments, don't filter
    if (showAllTreatments) {
      return true;
    }

    // Daily treatments always show
    if (treatment.frequency === "daily") {
      return true;
    }

    // For weekly treatments
    if (treatment.frequency === "weekly") {
      const today = selectedDate;
      const dayOfWeek = today.getDay(); // 0 = Sunday
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      // Check if completed this week
      const startOfWeekString = startOfWeek.toISOString().split("T")[0];

      const hasCompletedThisWeek = periodCompletions.some((completion) => {
        const completionDate = completion.date;
        return (
          completion.treatmentId === treatment.id &&
          completionDate >= startOfWeekString
        );
      });

      return !hasCompletedThisWeek;
    }

    // For monthly treatments
    if (treatment.frequency === "monthly") {
      const today = selectedDate;
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Check if completed this month
      const startOfMonthString = startOfMonth.toISOString().split("T")[0];

      const hasCompletedThisMonth = periodCompletions.some((completion) => {
        const completionDate = completion.date;
        return (
          completion.treatmentId === treatment.id &&
          completionDate >= startOfMonthString
        );
      });

      return !hasCompletedThisMonth;
    }

    return true;
  };

  // Function to check if treatment is completed in its current period (not just today)
  const isCompletedInPeriod = (treatment: any) => {
    if (treatment.frequency === "daily") {
      return isCompleted(treatment.id);
    }

    if (treatment.frequency === "weekly") {
      const today = selectedDate;
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      const startOfWeekString = startOfWeek.toISOString().split("T")[0];

      return periodCompletions.some(
        (completion) =>
          completion.treatmentId === treatment.id &&
          completion.date >= startOfWeekString
      );
    }

    if (treatment.frequency === "monthly") {
      const today = selectedDate;
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfMonthString = startOfMonth.toISOString().split("T")[0];

      return periodCompletions.some(
        (completion) =>
          completion.treatmentId === treatment.id &&
          completion.date >= startOfMonthString
      );
    }

    return false;
  };

  const markComplete = async (treatmentId: string) => {
    if (!user) return;

    const dateString = selectedDate.toISOString().split("T")[0];

    // Check if already completed
    const isCompleted = completions.some((c) => c.treatmentId === treatmentId);

    if (isCompleted) {
      // Find the completion to delete
      const completion = completions.find((c) => c.treatmentId === treatmentId);
      await deleteDoc(doc(db, "completions", completion.id));
      toast.success("Marked as incomplete");
    } else {
      // Add new completion
      await addDoc(collection(db, "completions"), {
        treatmentId,
        userId: user.uid,
        date: dateString,
        completedAt: Timestamp.now(),
      });
      toast.success("Marked as complete");
    }

    // Refresh completions
    fetchDailyCompletions(user.uid);
    fetchPeriodCompletions(user.uid);
  };

  const isCompleted = (treatmentId: string) => {
    return completions.some((c) => c.treatmentId === treatmentId);
  };

  // Get the completion period text based on frequency
  const getCompletionPeriodText = (treatment: any) => {
    if (treatment.frequency === "weekly") {
      return "Completed this week";
    } else if (treatment.frequency === "monthly") {
      return "Completed this month";
    }
    return "Completed today";
  };

  const handlePeriodCompletionToggle = async (treatment: any) => {
    if (!user) return;

    try {
      // Find all completions for this treatment in the current period
      const treatmentCompletions = periodCompletions.filter(
        (c) => c.treatmentId === treatment.id
      );

      // Delete each completion
      for (const completion of treatmentCompletions) {
        await deleteDoc(doc(db, "completions", completion.id));
      }

      toast.success("Marked as incomplete for this period");

      // Refresh completions
      fetchDailyCompletions(user.uid);
      fetchPeriodCompletions(user.uid);
    } catch (error) {
      console.error("Error toggling period completion:", error);
      toast.error("Failed to update completion status");
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  // Filter treatments based on frequency and completion status
  const filteredTreatments = treatments.filter(shouldShowTreatment);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Treatment Tracking Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />

              {/* Add view toggle */}
              <div className="flex items-center space-x-2 mt-4">
                <Switch
                  checked={showAllTreatments}
                  onCheckedChange={setShowAllTreatments}
                  id="show-all"
                />
                <label htmlFor="show-all" className="text-sm cursor-pointer">
                  Show all treatments
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Treatments for {selectedDate.toLocaleDateString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {treatments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    No treatments added yet
                  </p>
                  <Button
                    className="mt-2"
                    variant="outline"
                    onClick={() => router.push("/treatments")}
                  >
                    Add Treatments
                  </Button>
                </div>
              ) : filteredTreatments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    No treatments due for this period
                  </p>
                  <Button
                    className="mt-2"
                    variant="outline"
                    onClick={() => setShowAllTreatments(true)}
                  >
                    Show All Treatments
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTreatments.map((treatment) => (
                    <div
                      key={treatment.id}
                      className={`p-4 border rounded-md flex justify-between items-center ${
                        isCompleted(treatment.id)
                          ? "bg-green-50 border-green-200"
                          : isCompletedInPeriod(treatment)
                          ? "bg-blue-50 border-blue-200"
                          : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{treatment.name}</h3>
                          {!isCompleted(treatment.id) &&
                            isCompletedInPeriod(treatment) && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {getCompletionPeriodText(treatment)}
                              </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {treatment.type === "pharmaceutical"
                            ? "Medication"
                            : "Lifestyle"}{" "}
                          • {treatment.frequency} • For:{" "}
                          {treatment.conditionName}
                        </p>
                      </div>
                      <Button
                        variant={
                          isCompleted(treatment.id) ||
                          (showAllTreatments && isCompletedInPeriod(treatment))
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          if (isCompleted(treatment.id)) {
                            // If completed today, mark as incomplete
                            markComplete(treatment.id);
                          } else if (
                            showAllTreatments &&
                            isCompletedInPeriod(treatment)
                          ) {
                            // If completed in period but not today, allow marking incomplete by creating
                            // a completion for today then immediately deleting it
                            handlePeriodCompletionToggle(treatment);
                          } else {
                            // Not completed, mark as complete
                            markComplete(treatment.id);
                          }
                        }}
                      >
                        {isCompleted(treatment.id) ||
                        (showAllTreatments && isCompletedInPeriod(treatment))
                          ? "Completed ✓"
                          : "Mark Complete"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
