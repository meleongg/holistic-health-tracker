"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  ActivityIcon,
  PencilIcon,
  PillIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function ConditionsPage() {
  const [user, setUser] = useState<any>(null);
  const [conditionName, setConditionName] = useState("");
  const [conditionDescription, setConditionDescription] = useState("");
  const [conditions, setConditions] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCondition, setEditingCondition] = useState<any>(null);
  const [allTreatments, setAllTreatments] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchConditions(user.uid);
        fetchAllTreatments(user.uid);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchConditions = async (userId: string) => {
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
  };

  const fetchAllTreatments = async (userId: string) => {
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

      setAllTreatments(treatmentsList);
    } catch (error) {
      console.error("Error fetching all treatments:", error);
    }
  };

  const addCondition = async () => {
    if (!conditionName || !user) return;

    try {
      await addDoc(collection(db, "conditions"), {
        name: conditionName,
        description: conditionDescription,
        userId: user.uid,
        createdAt: new Date(),
      });

      toast.success("Condition added successfully");
      setConditionName("");
      setConditionDescription("");
      fetchConditions(user.uid);
    } catch (error) {
      toast.error("Error adding condition");
      console.error(error);
    }
  };

  const editCondition = async () => {
    if (!conditionName || !editingCondition || !user) return;

    try {
      await updateDoc(doc(db, "conditions", editingCondition.id), {
        name: conditionName,
        description: conditionDescription,
        updatedAt: new Date(),
      });

      toast.success("Condition updated successfully");
      setConditionName("");
      setConditionDescription("");
      setIsEditing(false);
      setEditingCondition(null);
      fetchConditions(user.uid);
    } catch (error) {
      toast.error("Error updating condition");
      console.error(error);
    }
  };

  const deleteCondition = async (id: string) => {
    try {
      await deleteDoc(doc(db, "conditions", id));
      toast.success("Condition deleted");
      fetchConditions(user.uid);
    } catch (error) {
      toast.error("Error deleting condition");
      console.error(error);
    }
  };

  const conditionTreatments = useMemo(() => {
    return allTreatments.reduce((acc, treatment) => {
      const conditionId = treatment.conditionId;
      if (!acc[conditionId]) {
        acc[conditionId] = [];
      }
      acc[conditionId].push(treatment);
      return acc;
    }, {} as Record<string, any[]>);
  }, [allTreatments]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Health Conditions</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? "Edit Condition" : "Add New Condition"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Condition Name
              </label>
              <Input
                placeholder="E.g., Diabetes, Hypertension, etc."
                value={conditionName}
                onChange={(e) => setConditionName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description (Optional)
              </label>
              <Input
                placeholder="Additional details about your condition"
                value={conditionDescription}
                onChange={(e) => setConditionDescription(e.target.value)}
              />
            </div>

            <Button onClick={isEditing ? editCondition : addCondition}>
              {isEditing ? "Update Condition" : "Add Condition"}
            </Button>
            {isEditing && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditingCondition(null);
                  setConditionName("");
                  setConditionDescription("");
                }}
                className="ml-2"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <h2 className="text-xl font-semibold">Your Conditions</h2>

        {conditions.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-slate-50">
            <ActivityIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-muted-foreground mb-1">
              No conditions added yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Add your first health condition to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conditions.map((condition) => (
              <Card
                key={condition.id}
                className="overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <div className="h-2 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                <CardContent className="pt-6">
                  <div className="flex justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold">
                          {condition.name}
                        </h3>
                        <Badge variant="outline" className="ml-2">
                          {new Date(
                            condition.createdAt?.toDate()
                          ).toLocaleDateString() || "New"}
                        </Badge>
                      </div>
                      {condition.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {condition.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Treatment count summary - you can add this if you want */}
                  <div className="flex items-center mt-4 text-sm text-muted-foreground">
                    <PillIcon className="h-4 w-4 mr-1.5" />
                    <span>
                      {conditionTreatments[condition.id]?.length || 0}{" "}
                      treatments
                    </span>
                  </div>

                  <div className="flex mt-4 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        router.push(`/treatments?condition=${condition.id}`)
                      }
                    >
                      <PlusIcon className="h-4 w-4 mr-1.5" />
                      Add Treatment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // You could implement an edit function
                        setEditingCondition(condition);
                        setConditionName(condition.name);
                        setConditionDescription(condition.description || "");
                        setIsEditing(true);
                      }}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deleteCondition(condition.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
