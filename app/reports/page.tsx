"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null);
  const [conditions, setConditions] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchUserData(user.uid);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchUserData = async (userId: string) => {
    setLoading(true);
    try {
      // Fetch conditions
      const conditionsQuery = query(
        collection(db, "conditions"),
        where("userId", "==", userId)
      );
      const conditionsSnapshot = await getDocs(conditionsQuery);
      const conditionsList = conditionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setConditions(conditionsList);

      // Fetch treatments
      const treatmentsQuery = query(
        collection(db, "treatments"),
        where("userId", "==", userId)
      );
      const treatmentsSnapshot = await getDocs(treatmentsQuery);
      const treatmentsList = treatmentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTreatments(treatmentsList);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    const printWindow = window.open("", "_blank");

    if (printWindow && reportRef.current) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Health Treatment Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1, h2 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            ${reportRef.current.innerHTML}
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  if (loading) {
    return <div>Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Treatment Reports</h1>
        <Button onClick={printReport}>Print Report</Button>
      </div>

      <div ref={reportRef}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Health Treatment Report</CardTitle>
            <p className="text-muted-foreground">
              Generated on {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent>
            <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-4">
              Health Conditions
            </h2>
            {conditions.length > 0 ? (
              <table className="w-full border-collapse mb-6">
                <thead>
                  <tr>
                    <th className="border p-2 text-left">Condition</th>
                    <th className="border p-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {conditions.map((condition) => (
                    <tr key={condition.id}>
                      <td className="border p-2">{condition.name}</td>
                      <td className="border p-2">
                        {condition.description || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No conditions recorded.</p>
            )}

            <h2 className="text-xl font-semibold mt-6 mb-4">
              Current Treatments
            </h2>
            {treatments.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 text-left">Treatment</th>
                    <th className="border p-2 text-left">Type</th>
                    <th className="border p-2 text-left">Frequency</th>
                    <th className="border p-2 text-left">For Condition</th>
                    <th className="border p-2 text-left">Effectiveness</th>
                    <th className="border p-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {treatments.map((treatment) => (
                    <tr key={treatment.id}>
                      <td className="border p-2">{treatment.name}</td>
                      <td className="border p-2">
                        {treatment.type === "pharmaceutical"
                          ? "Medication"
                          : "Lifestyle/Alternative"}
                      </td>
                      <td className="border p-2 capitalize">
                        {treatment.frequency}
                      </td>
                      <td className="border p-2">{treatment.conditionName}</td>
                      <td className="border p-2">
                        {treatment.effectiveness || "Not rated"}
                      </td>
                      <td className="border p-2">{treatment.notes || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No treatments recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
