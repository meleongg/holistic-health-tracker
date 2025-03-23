"use client";

// Update imports to use Lucide React directly
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
import {
  Activity as ActivityIcon,
  CheckCircle as CheckCircleIcon,
  Check as CheckIcon,
  Circle as CircleIcon, // Add this for details button
  FileText, // Add this as another option
  Pill as PillIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner"; // Add this import

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [periodCompletions, setPeriodCompletions] = useState<any[]>([]); // New state for tracking period completions
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAllTreatments, setShowAllTreatments] = useState(false); // New state for toggle
  const [filterType, setFilterType] = useState("all");
  const [filterCondition, setFilterCondition] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const treatmentsPerPage = 5;
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

  // Add this to derive condition options from treatments
  const conditionOptions = useMemo(() => {
    const uniqueConditions = new Map();
    treatments.forEach((treatment) => {
      if (
        treatment.conditionId &&
        !uniqueConditions.has(treatment.conditionId)
      ) {
        uniqueConditions.set(treatment.conditionId, {
          id: treatment.conditionId,
          name: treatment.conditionName || "Unknown Condition",
        });
      }
    });
    return Array.from(uniqueConditions.values());
  }, [treatments]);

  if (!user) {
    return <div>Loading...</div>;
  }

  // Filter treatments based on frequency and completion status
  const filteredTreatments = treatments.filter(shouldShowTreatment);

  // Filter treatments based on type and condition
  const displayedTreatments = filteredTreatments.filter((treatment) => {
    if (filterType !== "all" && treatment.type !== filterType) {
      return false;
    }
    if (
      filterCondition !== "all" &&
      treatment.conditionId !== filterCondition
    ) {
      return false;
    }
    return true;
  });

  // Pagination logic
  const pageCount = Math.ceil(displayedTreatments.length / treatmentsPerPage);
  const currentTreatments = displayedTreatments.slice(
    (currentPage - 1) * treatmentsPerPage,
    currentPage * treatmentsPerPage
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Treatment Tracking Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent className="px-1 sm:px-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border mx-auto"
              />

              {/* Add view toggle */}
              <div className="flex items-center space-x-2 mt-4 px-2 sm:px-0">
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
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-2">
              <CardTitle className="text-lg">
                Treatments for {selectedDate.toLocaleDateString()}
              </CardTitle>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-[140px] h-9">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pharmaceutical">Medications</SelectItem>
                    <SelectItem value="non-pharmaceutical">
                      Lifestyle
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterCondition}
                  onValueChange={setFilterCondition}
                >
                  <SelectTrigger className="w-full sm:w-[160px] h-9">
                    <SelectValue placeholder="Filter by condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conditions</SelectItem>
                    {conditionOptions.map((condition) => (
                      <SelectItem key={condition.id} value={condition.id}>
                        {condition.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              ) : displayedTreatments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    No treatments match your current filters
                  </p>
                  <Button
                    className="mt-2"
                    variant="outline"
                    onClick={() => {
                      setFilterType("all");
                      setFilterCondition("all");
                      setShowAllTreatments(true);
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {currentTreatments.map((treatment) => (
                      <div
                        key={treatment.id}
                        className={`p-4 rounded-md border transition-all ${
                          isCompleted(treatment.id)
                            ? "bg-green-50 border-green-200 shadow-sm"
                            : isCompletedInPeriod(treatment)
                            ? "bg-blue-50 border-blue-200"
                            : "hover:border-primary/30 hover:bg-muted/20"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-1 w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
                                isCompleted(treatment.id)
                                  ? "bg-green-100 text-green-700"
                                  : isCompletedInPeriod(treatment)
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {treatment.type === "pharmaceutical" ? (
                                <PillIcon className="h-4 w-4" />
                              ) : (
                                <ActivityIcon className="h-4 w-4" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <h3 className="font-medium truncate">
                                  {treatment.name}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {treatment.frequency}
                                </Badge>
                              </div>

                              {/* Better responsive layout for medication type and condition */}
                              <div className="text-sm text-muted-foreground mt-0.5">
                                {/* Mobile layout - stacked */}
                                <div className="flex flex-col gap-1 sm:hidden">
                                  <div className="flex items-center">
                                    {treatment.type === "pharmaceutical" ? (
                                      <>
                                        <PillIcon className="h-3 w-3 mr-1.5" />
                                        <span>Medication</span>
                                      </>
                                    ) : (
                                      <>
                                        <ActivityIcon className="h-3 w-3 mr-1.5" />
                                        <span>Lifestyle</span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex items-center">
                                    <span>{treatment.conditionName}</span>
                                  </div>
                                </div>

                                {/* Desktop layout - inline with bullet separator */}
                                <div className="hidden sm:flex sm:items-center">
                                  <span>
                                    {treatment.type === "pharmaceutical"
                                      ? "Medication"
                                      : "Lifestyle"}
                                  </span>
                                  <span className="mx-2">•</span>
                                  <span>{treatment.conditionName}</span>
                                </div>
                              </div>

                              {!isCompleted(treatment.id) &&
                                isCompletedInPeriod(treatment) && (
                                  <div className="mt-1.5">
                                    <span className="inline-flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                      <CheckCircleIcon className="mr-1 h-3 w-3" />
                                      {getCompletionPeriodText(treatment)}
                                    </span>
                                  </div>
                                )}
                            </div>
                          </div>

                          {/* Improved responsive buttons */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2 sm:mt-0">
                            <Button
                              variant={
                                isCompleted(treatment.id) ||
                                (showAllTreatments &&
                                  isCompletedInPeriod(treatment))
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              className={`h-9 ${
                                isCompleted(treatment.id)
                                  ? "bg-green-600 hover:bg-green-700"
                                  : ""
                              }`}
                              onClick={() => {
                                if (isCompleted(treatment.id)) {
                                  markComplete(treatment.id);
                                } else if (
                                  showAllTreatments &&
                                  isCompletedInPeriod(treatment)
                                ) {
                                  handlePeriodCompletionToggle(treatment);
                                } else {
                                  markComplete(treatment.id);
                                }
                              }}
                            >
                              {isCompleted(treatment.id) ||
                              (showAllTreatments &&
                                isCompletedInPeriod(treatment)) ? (
                                <>
                                  <CheckIcon className="h-4 w-4 mr-1.5" />{" "}
                                  Complete
                                </>
                              ) : (
                                <>
                                  <CircleIcon className="h-4 w-4 mr-1.5" /> Mark
                                  Done
                                </>
                              )}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9"
                              onClick={() =>
                                router.push(`/treatments/${treatment.id}`)
                              }
                            >
                              <FileText className="h-4 w-4 mr-1.5" />
                              <span>Details</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination controls */}
                  {displayedTreatments.length > treatmentsPerPage && (
                    <div className="flex justify-center mt-6">
                      <div className="flex flex-wrap justify-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>

                        {/* Show fewer page buttons on mobile */}
                        <div className="hidden sm:flex space-x-1">
                          {Array.from({ length: pageCount }, (_, i) => i + 1)
                            .filter(
                              (page) =>
                                page === 1 ||
                                page === pageCount ||
                                (page >= currentPage - 1 &&
                                  page <= currentPage + 1)
                            )
                            .map((page, i, arr) => (
                              <React.Fragment key={page}>
                                {i > 0 && arr[i - 1] !== page - 1 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9"
                                    disabled
                                  >
                                    ...
                                  </Button>
                                )}
                                <Button
                                  variant={
                                    currentPage === page ? "default" : "outline"
                                  }
                                  size="sm"
                                  className="h-9"
                                  onClick={() => setCurrentPage(page)}
                                >
                                  {page}
                                </Button>
                              </React.Fragment>
                            ))}
                        </div>

                        {/* Mobile pagination is simpler */}
                        <div className="sm:hidden flex items-center px-3 h-9 border rounded-md">
                          <span className="text-sm">
                            Page {currentPage} of {pageCount}
                          </span>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9"
                          onClick={() =>
                            setCurrentPage((p) => Math.min(pageCount, p + 1))
                          }
                          disabled={currentPage === pageCount}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
