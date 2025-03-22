"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function TreatmentsPage() {
  const [user, setUser] = useState<any>(null);
  const [conditions, setConditions] = useState<any[]>([]);
  const [selectedCondition, setSelectedCondition] = useState("");
  const [treatmentName, setTreatmentName] = useState("");
  const [treatmentType, setTreatmentType] = useState("pharmaceutical");
  const [frequency, setFrequency] = useState("daily");
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conditionsLoading, setConditionsLoading] = useState(true); // Add this line
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchConditions(user.uid);
        fetchTreatments(user.uid);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchConditions = async (userId: string) => {
    setConditionsLoading(true); // Add this line
    try {
      const conditionsQuery = query(
        collection(db, "conditions"),
        where("userId", "==", userId)
      );

      const snapshot = await getDocs(conditionsQuery);
      const conditionsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setConditions(conditionsList);
    } catch (error) {
      console.error("Error fetching conditions:", error);
      toast.error("Failed to load conditions");
    } finally {
      setConditionsLoading(false); // Add this line
    }
  };

  const fetchTreatments = async (userId: string) => {
    setLoading(true);
    try {
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
    } catch (error) {
      console.error("Error fetching treatments:", error);
      toast.error("Failed to load treatments");
    } finally {
      setLoading(false);
    }
  };

  const addTreatment = async () => {
    if (!treatmentName || !selectedCondition || !user) return;

    try {
      const condition = conditions.find((c) => c.id === selectedCondition);

      await addDoc(collection(db, "treatments"), {
        name: treatmentName,
        type: treatmentType,
        frequency: frequency,
        conditionId: selectedCondition,
        conditionName: condition?.name || "",
        userId: user.uid,
        createdAt: new Date(),
      });

      toast.success("Treatment added successfully");
      setTreatmentName("");
      fetchTreatments(user.uid);
    } catch (error) {
      toast.error("Error adding treatment");
      console.error(error);
    }
  };

  const deleteTreatment = async (id: string) => {
    try {
      await deleteDoc(doc(db, "treatments", id));
      toast.success("Treatment deleted");
      fetchTreatments(user.uid);
    } catch (error) {
      toast.error("Error deleting treatment");
      console.error(error);
    }
  };

  if (!user && loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Treatments</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add New Treatment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Related Condition
              </label>
              <Select
                value={selectedCondition}
                onValueChange={setSelectedCondition}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a condition" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((condition) => (
                    <SelectItem key={condition.id} value={condition.id}>
                      {condition.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!conditionsLoading && conditions.length === 0 && (
                <p className="text-sm text-yellow-600 mt-1">
                  Please add a condition first
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Treatment Name
              </label>
              <Input
                placeholder="E.g., Insulin, Daily walk, etc."
                value={treatmentName}
                onChange={(e) => setTreatmentName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <Select value={treatmentType} onValueChange={setTreatmentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pharmaceutical">Medication</SelectItem>
                  <SelectItem value="non-pharmaceutical">
                    Lifestyle/Alternative
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Frequency
              </label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={addTreatment} disabled={conditions.length === 0}>
              Add Treatment
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Treatments</h2>

        {loading ? (
          <p>Loading treatments...</p>
        ) : treatments.length === 0 ? (
          <p className="text-muted-foreground">No treatments added yet.</p>
        ) : (
          treatments.map((treatment) => (
            <Card
              key={treatment.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => router.push(`/treatments/${treatment.id}`)}
                  >
                    <h3 className="text-lg font-medium">
                      {treatment.name}
                      {treatment.effectiveness && (
                        <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Rated: {treatment.effectiveness}/10
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {treatment.type === "pharmaceutical"
                        ? "Medication"
                        : "Lifestyle"}{" "}
                      • {treatment.frequency} • For: {treatment.conditionName}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/treatments/${treatment.id}`)}
                    >
                      Details
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteTreatment(treatment.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {!treatment.effectiveness && (
                  <div className="text-xs text-muted-foreground mt-3 border-t pt-2 italic">
                    Click to rate effectiveness and add treatment notes
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
