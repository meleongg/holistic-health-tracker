"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchTreatments(user.uid);
        fetchCompletions(user.uid);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router, selectedDate]);

  const fetchTreatments = async (userId: string) => {
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

  const fetchCompletions = async (userId: string) => {
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
    fetchCompletions(user.uid);
  };

  const isCompleted = (treatmentId: string) => {
    return completions.some((c) => c.treatmentId === treatmentId);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

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
              ) : (
                <div className="space-y-4">
                  {treatments.map((treatment) => (
                    <div
                      key={treatment.id}
                      className={`p-4 border rounded-md flex justify-between items-center ${
                        isCompleted(treatment.id)
                          ? "bg-green-50 border-green-200"
                          : ""
                      }`}
                    >
                      <div>
                        <h3 className="font-medium">{treatment.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {treatment.type === "pharmaceutical"
                            ? "Medication"
                            : "Lifestyle"}{" "}
                          •{treatment.frequency} • For:{" "}
                          {treatment.conditionName}
                        </p>
                      </div>
                      <Button
                        variant={
                          isCompleted(treatment.id) ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => markComplete(treatment.id)}
                      >
                        {isCompleted(treatment.id)
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
