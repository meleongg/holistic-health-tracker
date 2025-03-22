"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Define an interface for the treatment data
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

export default function TreatmentDetailsPage() {
  const [user, setUser] = useState<any>(null);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [loading, setLoading] = useState(true);
  const [effectiveness, setEffectiveness] = useState(0);
  const [notes, setNotes] = useState("");
  const router = useRouter();
  const params = useParams();
  const treatmentId = params.id as string;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchTreatment(treatmentId, user.uid);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router, treatmentId]);

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
      toast.success("Treatment updated successfully");
    } catch (error) {
      console.error("Error updating treatment:", error);
      toast.error("Failed to update treatment");
    }
  };

  if (loading) {
    return <div>Loading treatment details...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{treatment?.name}</h1>
        <Button variant="outline" onClick={() => router.push("/treatments")}>
          Back to Treatments
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Treatment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-lg">
                {treatment?.type === "pharmaceutical"
                  ? "Medication"
                  : "Lifestyle/Alternative"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Frequency</dt>
              <dd className="mt-1 text-lg capitalize">
                {treatment?.frequency}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                For Condition
              </dt>
              <dd className="mt-1 text-lg">{treatment?.conditionName}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

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
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`h-10 w-10 rounded-md ${
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
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Textarea
                placeholder="Add notes about side effects, effectiveness, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            <Button onClick={updateTreatmentEffectiveness}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
