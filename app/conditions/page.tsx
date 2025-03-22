"use client";

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
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ConditionsPage() {
  const [user, setUser] = useState<any>(null);
  const [conditionName, setConditionName] = useState("");
  const [conditionDescription, setConditionDescription] = useState("");
  const [conditions, setConditions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchConditions(user.uid);
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

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Health Conditions</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add New Condition</CardTitle>
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

            <Button onClick={addCondition}>Add Condition</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Conditions</h2>

        {conditions.length === 0 ? (
          <p className="text-muted-foreground">No conditions added yet.</p>
        ) : (
          conditions.map((condition) => (
            <Card key={condition.id}>
              <CardContent className="pt-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{condition.name}</h3>
                  {condition.description && (
                    <p className="text-muted-foreground">
                      {condition.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteCondition(condition.id)}
                >
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
