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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { Loader2, PencilIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Define interfaces for the data structures
interface Treatment {
  id: string;
  name: string;
  type: string;
  frequency: string;
  conditionId: string;
  conditionName: string;
  userId: string;
  effectiveness?: number;
  notes?: string;
  createdAt: any;
}

interface Condition {
  id: string;
  name: string;
  description?: string;
  userId: string;
}

export default function TreatmentDetailsPage() {
  const [user, setUser] = useState<any>(null);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [loading, setLoading] = useState(true);
  const [effectiveness, setEffectiveness] = useState(0);
  const [notes, setNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editFrequency, setEditFrequency] = useState("");
  const [editConditionId, setEditConditionId] = useState("");
  const [activeTab, setActiveTab] = useState("details");

  const router = useRouter();
  const params = useParams();
  const treatmentId = params.id as string;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchTreatment(treatmentId, user.uid);
        fetchConditions(user.uid);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router, treatmentId]);

  const fetchConditions = async (userId: string) => {
    try {
      const conditionsQuery = query(
        collection(db, "conditions"),
        where("userId", "==", userId)
      );

      const snapshot = await getDocs(conditionsQuery);
      const conditionsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Condition[];

      setConditions(conditionsList);
    } catch (error) {
      console.error("Error fetching conditions:", error);
    }
  };

  const fetchTreatment = async (id: string, userId: string) => {
    setLoading(true);
    try {
      const treatmentDoc = await getDoc(doc(db, "treatments", id));

      if (treatmentDoc.exists() && treatmentDoc.data().userId === userId) {
        // Cast the data to our Treatment type with proper typing
        const treatmentData = {
          id: treatmentDoc.id,
          ...treatmentDoc.data(),
        } as Treatment;

        setTreatment(treatmentData);
        setEffectiveness(treatmentData.effectiveness || 0);
        setNotes(treatmentData.notes || "");

        // Set edit form state
        setEditName(treatmentData.name);
        setEditType(treatmentData.type);
        setEditFrequency(treatmentData.frequency);
        setEditConditionId(treatmentData.conditionId);
      } else {
        toast.error("Treatment not found");
        router.push("/treatments");
      }
    } catch (error) {
      console.error("Error fetching treatment:", error);
      toast.error("Error loading treatment details");
    } finally {
      setLoading(false);
    }
  };

  const updateTreatmentEffectiveness = async () => {
    try {
      await updateDoc(doc(db, "treatments", treatmentId), {
        effectiveness,
        notes,
      });

      // Update local state
      setTreatment((prev) => (prev ? { ...prev, effectiveness, notes } : null));

      toast.success("Treatment updated successfully");
    } catch (error) {
      console.error("Error updating treatment:", error);
      toast.error("Failed to update treatment");
    }
  };

  const updateTreatmentDetails = async () => {
    if (!editName || !editConditionId) {
      toast.error("Treatment name and condition are required");
      return;
    }

    try {
      const condition = conditions.find((c) => c.id === editConditionId);

      await updateDoc(doc(db, "treatments", treatmentId), {
        name: editName,
        type: editType,
        frequency: editFrequency,
        conditionId: editConditionId,
        conditionName: condition?.name || "",
      });

      // Update local state
      setTreatment((prev) =>
        prev
          ? {
              ...prev,
              name: editName,
              type: editType,
              frequency: editFrequency,
              conditionId: editConditionId,
              conditionName: condition?.name || "",
            }
          : null
      );

      setIsEditing(false);
      toast.success("Treatment details updated successfully");
    } catch (error) {
      console.error("Error updating treatment details:", error);
      toast.error("Failed to update treatment details");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[50vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Loading treatment details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold truncate">
          {treatment?.name}
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-full sm:w-auto justify-center"
            onClick={() => setIsEditing(!isEditing)}
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            {isEditing ? "Cancel Edit" : "Edit Treatment"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-full sm:w-auto justify-center"
            onClick={() => router.push("/treatments")}
          >
            Back to Treatments
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 grid grid-cols-2 w-full">
          <TabsTrigger value="details" className="text-sm">
            Treatment Details
          </TabsTrigger>
          <TabsTrigger value="effectiveness" className="text-sm">
            Track Effectiveness
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Details</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Treatment Name
                    </label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Type
                      </label>
                      <Select value={editType} onValueChange={setEditType}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pharmaceutical">
                            Medication
                          </SelectItem>
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
                      <Select
                        value={editFrequency}
                        onValueChange={setEditFrequency}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Related Condition
                    </label>
                    <Select
                      value={editConditionId}
                      onValueChange={setEditConditionId}
                    >
                      <SelectTrigger className="h-10">
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
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      onClick={updateTreatmentDetails}
                      className="w-full sm:w-auto h-10"
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="w-full sm:w-auto h-10"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="p-3 bg-slate-50 rounded-md">
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-base sm:text-lg">
                      {treatment?.type === "pharmaceutical"
                        ? "Medication"
                        : "Lifestyle/Alternative"}
                    </dd>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-md">
                    <dt className="text-sm font-medium text-gray-500">
                      Frequency
                    </dt>
                    <dd className="mt-1 text-base sm:text-lg capitalize">
                      {treatment?.frequency}
                    </dd>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-md sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">
                      For Condition
                    </dt>
                    <dd className="mt-1 text-base sm:text-lg">
                      {treatment?.conditionName}
                    </dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="effectiveness">
          <Card>
            <CardHeader>
              <CardTitle>Track Effectiveness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    How effective is this treatment? (1-10)
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`h-12 w-full rounded-md flex items-center justify-center ${
                          effectiveness === value
                            ? "bg-primary text-primary-foreground"
                            : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                        }`}
                        onClick={() => setEffectiveness(value)}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Notes
                  </label>
                  <Textarea
                    placeholder="Add notes about side effects, effectiveness, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="min-h-[100px]"
                  />
                </div>

                <Button
                  onClick={updateTreatmentEffectiveness}
                  className="w-full sm:w-auto h-10 mt-2"
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
