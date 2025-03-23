"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Download, FileText, Loader2, Pill, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null);
  const [conditions, setConditions] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [adherenceData, setAdherenceData] = useState<any[]>([]);
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

      // Also fetch adherence data
      const adherenceResults = await fetchAdherenceData(userId);
      setAdherenceData(adherenceResults);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  // Add this function to fetch adherence data alongside your existing fetchUserData function

  const fetchAdherenceData = async (userId: string) => {
    try {
      // Get all user's treatments (already fetched in fetchUserData, but shown here for completeness)
      const treatmentsQuery = query(
        collection(db, "treatments"),
        where("userId", "==", userId)
      );
      const treatmentsSnapshot = await getDocs(treatmentsQuery);
      const treatments = treatmentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get all user's completions
      const completionsQuery = query(
        collection(db, "completions"),
        where("userId", "==", userId)
      );
      const completionsSnapshot = await getDocs(completionsQuery);
      const completions = completionsSnapshot.docs.map((doc) => doc.data());

      // Calculate adherence by day (last 7 days)
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date);
      }

      const chartData = dates.map((date) => {
        const dateString = date.toISOString().split("T")[0];
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const fullDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        // Count completions for this date
        const totalForDay = treatments.length;
        const completedForDay = completions.filter(
          (c) => c.date === dateString
        ).length;

        const adherenceRate =
          totalForDay > 0
            ? Math.round((completedForDay / totalForDay) * 100)
            : 0;

        return {
          day: dayName,
          date: fullDate,
          adherence: adherenceRate,
          completed: completedForDay,
          total: totalForDay,
        };
      });

      return chartData;
    } catch (error) {
      console.error("Error fetching adherence data:", error);
      return [];
    }
  };

  // Add these helper functions for adherence analytics

  // Calculate overall adherence for the week
  const calculateOverallAdherence = () => {
    if (adherenceData.length === 0) return 0;

    const totalCompletions = adherenceData.reduce(
      (acc, day) => acc + day.completed,
      0
    );
    const totalTreatments = adherenceData.reduce(
      (acc, day) => acc + day.total,
      0
    );

    return totalTreatments > 0
      ? Math.round((totalCompletions / totalTreatments) * 100)
      : 0;
  };

  // Get adherence status text and color
  const getAdherenceStatus = (adherence: number) => {
    if (adherence >= 80) return { text: "Excellent", color: "#166534" };
    if (adherence >= 60) return { text: "Good", color: "#1e40af" };
    if (adherence >= 40) return { text: "Fair", color: "#854d0e" };
    return { text: "Needs Improvement", color: "#b91c1c" };
  };

  // Get the best day from adherence data
  const getBestDay = () => {
    if (adherenceData.length === 0) return { day: "N/A", adherence: 0 };

    return adherenceData.reduce(
      (max, day) => (day.adherence > max.adherence ? day : max),
      adherenceData[0]
    );
  };

  const printReport = () => {
    const printWindow = window.open("", "_blank");

    if (printWindow && reportRef.current) {
      // Create stylesheet
      const style = printWindow.document.createElement("style");
      style.textContent = `
        /* Base styles */
        body { 
          font-family: Arial, sans-serif; 
          padding: 30px; 
          line-height: 1.5;
          color: #333;
          max-width: 900px;
          margin: 0 auto;
        }
        h1 { 
          color: #2563eb; 
          font-size: 24px;
          margin-bottom: 8px;
        }
        h2 { 
          color: #333; 
          font-size: 18px;
          margin-top: 24px;
          margin-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
        }
        .report-date {
          color: #666;
          margin-bottom: 24px;
          font-size: 14px;
        }
        
        /* Table improvements */
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 24px;
          page-break-inside: auto;
        }
        tr { 
          page-break-inside: avoid; 
          page-break-after: auto;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 10px 12px; 
          text-align: left;
          font-size: 12px;
        }
        th { 
          background-color: #f0f4f8; 
          font-weight: 600;
          color: #333;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        /* Patient info section */
        .patient-info {
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .patient-info p {
          margin: 6px 0;
        }
        .label {
          font-weight: 600;
          display: inline-block;
          min-width: 120px;
        }
        
        /* Rating display */
        .rating {
          display: inline-block;
          background-color: #dcfce7;
          color: #166534;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 500;
          font-size: 11px;
        }
        
        /* Section spacing */
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        /* Footer */
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 11px;
          color: #6b7280;
        }
        
        /* Badges for types */
        .badge {
          display: inline-block;
          background-color: #f3f4f6;
          padding: 1px 6px;
          border-radius: 12px;
          font-size: 11px;
          border: 1px solid #e5e7eb;
        }
        
        /* Header section */
        .report-header {
          margin-bottom: 30px;
        }
        
        /* Ensure content fits well on paper */
        @page {
          size: A4;
          margin: 2cm;
        }
        
        @media print {
          body { font-size: 12pt; }
          h1 { font-size: 18pt; }
          h2 { font-size: 14pt; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          .section { page-break-inside: avoid; }
        }

        /* Adherence metrics styling */
        .adherence-meter {
          height: 8px;
          background-color: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          width: 100px;
          display: inline-block;
          margin-right: 8px;
        }
        .adherence-value {
          height: 100%;
          background-color: #4f46e5;
          border-radius: 4px;
        }
        .adherence-status {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
        }
      `;

      // Set document title
      printWindow.document.title = "Health Treatment Report";

      // Create HTML content manually instead of using document.write
      const htmlContent = `
        <div class="report-header">
          <h1>Health Treatment Report</h1>
          <div class="report-date">
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </div>
        </div>
        
        <div class="section">
          <h2>Patient Information</h2>
          <div class="patient-info">
            <p><span class="label">Email:</span> ${user?.email}</p>
            <p><span class="label">User ID:</span> <span style="color: #6b7280; font-size: 0.9em;">${user?.uid.substring(
              0,
              8
            )}...</span></p>
          </div>
        </div>
        
        <div class="section">
          <h2>Health Conditions (${conditions.length})</h2>
          ${
            conditions.length > 0
              ? `<table>
                  <thead>
                    <tr>
                      <th style="width: 30%">Condition</th>
                      <th style="width: 50%">Description</th>
                      <th style="width: 20%">Date Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${conditions
                      .map(
                        (condition) => `
                      <tr>
                        <td style="font-weight: 500">${condition.name}</td>
                        <td>${
                          condition.description || "No description provided"
                        }</td>
                        <td>${
                          condition.createdAt
                            ? new Date(
                                condition.createdAt.toDate()
                              ).toLocaleDateString()
                            : "N/A"
                        }</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>`
              : `<p style="text-align: center; padding: 20px; background-color: #f9fafb; border-radius: 4px;">No conditions recorded.</p>`
          }
        </div>
        
        <div class="section">
          <h2>Current Treatments (${treatments.length})</h2>
          ${
            treatments.length > 0
              ? `<table>
                  <thead>
                    <tr>
                      <th style="width: 25%">Treatment</th>
                      <th style="width: 15%">Type</th>
                      <th style="width: 15%">Frequency</th>
                      <th style="width: 25%">For Condition</th>
                      <th style="width: 20%">Effectiveness</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${treatments
                      .map(
                        (treatment) => `
                      <tr>
                        <td style="font-weight: 500">${treatment.name}</td>
                        <td><span class="badge">${
                          treatment.type === "pharmaceutical"
                            ? "Medication"
                            : "Lifestyle"
                        }</span></td>
                        <td style="text-transform: capitalize">${
                          treatment.frequency
                        }</td>
                        <td>${treatment.conditionName}</td>
                        <td>${
                          treatment.effectiveness
                            ? `<span class="rating">${treatment.effectiveness}/10</span>`
                            : "Not rated"
                        }</td>
                      </tr>
                      ${
                        treatment.notes
                          ? `<tr>
                              <td colspan="5" style="border-top: none; padding-top: 8px; padding-bottom: 8px; background-color: #fafafa;">
                                <div style="font-size: 12px; color: #4b5563; margin: 2px 0;">
                                  <span style="font-weight: 600; margin-right: 4px;">Notes:</span> ${treatment.notes}
                                </div>
                              </td>
                            </tr>`
                          : ""
                      }
                    `
                      )
                      .join("")}
                  </tbody>
                </table>`
              : `<p style="text-align: center; padding: 20px; background-color: #f9fafb; border-radius: 4px;">No treatments recorded.</p>`
          }
        </div>
        
        <div class="section">
          <h2>Treatment Adherence - Last 7 Days</h2>
          
          <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
            <div style="flex: 1; min-width: 180px; background-color: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0;">
              <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Weekly Adherence</div>
              <div style="font-size: 24px; font-weight: 600; color: #0f172a;">${calculateOverallAdherence()}%</div>
              <div style="margin-top: 8px; padding: 4px 8px; display: inline-block; border-radius: 4px; font-size: 12px; background-color: ${
                getAdherenceStatus(calculateOverallAdherence()).color
              }20; color: ${
        getAdherenceStatus(calculateOverallAdherence()).color
      };">
                ${getAdherenceStatus(calculateOverallAdherence()).text}
              </div>
            </div>
            
            <div style="flex: 1; min-width: 180px; background-color: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0;">
              <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Best Day</div>
              <div style="font-size: 24px; font-weight: 600; color: #0f172a;">${
                getBestDay().day
              }</div>
              <div style="margin-top: 8px; font-size: 12px; color: #64748b;">
                ${getBestDay().adherence}% completion rate
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 20%">Day</th>
                <th style="width: 20%">Date</th>
                <th style="width: 20%">Treatments Completed</th>
                <th style="width: 20%">Adherence Rate</th>
                <th style="width: 20%">Status</th>
              </tr>
            </thead>
            <tbody>
              ${adherenceData
                .map(
                  (day) => `
                <tr>
                  <td>${day.day}</td>
                  <td>${day.date}</td>
                  <td>${day.completed} of ${day.total}</td>
                  <td>
                    <div style="display: flex; align-items: center;">
                      <div class="adherence-meter">
                        <div class="adherence-value" style="width: ${
                          day.adherence
                        }%;"></div>
                      </div>
                      <span>${day.adherence}%</span>
                    </div>
                  </td>
                  <td>
                    <span class="adherence-status" style="background-color: ${
                      getAdherenceStatus(day.adherence).color
                    }20; color: ${getAdherenceStatus(day.adherence).color};">
                      ${getAdherenceStatus(day.adherence).text}
                    </span>
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <div style="margin-top: 12px; font-size: 12px; color: #64748b; font-style: italic;">
            Note: This adherence data helps healthcare providers understand how consistently the patient is following their treatment plan.
          </div>
        </div>
        
        <div class="footer">
          <p>This report was generated by Holistic Health Tracker.</p>
          <p>For medical advice, please consult with your healthcare provider.</p>
        </div>
      `;

      // Apply the styles and content to the new window
      printWindow.document.head.appendChild(style);
      printWindow.document.body.innerHTML = htmlContent;

      // Focus the window and print after a slight delay
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Generating your report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            Treatment Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and print your health treatment summary
          </p>
        </div>
        <Button onClick={printReport} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </div>

      <div ref={reportRef} className="print-container">
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-primary">
              Health Treatment Report
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Generated on {new Date().toLocaleDateString()} at{" "}
              {new Date().toLocaleTimeString()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="section">
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <User className="mr-2 h-5 w-5 text-muted-foreground" />
                Patient Information
              </h2>
              <div className="pl-1 mb-2">
                <p className="mb-1">
                  <span className="font-medium inline-block w-20 sm:w-32">
                    Email:
                  </span>
                  {user?.email}
                </p>
                <p className="mb-1">
                  <span className="font-medium inline-block w-20 sm:w-32">
                    User ID:
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {user?.uid.substring(0, 8)}...
                  </span>
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="section">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2 h-5 w-5 flex items-center justify-center text-muted-foreground">
                  🩺
                </span>
                Health Conditions ({conditions.length})
              </h2>

              {/* Desktop view: Table for conditions */}
              {conditions.length > 0 ? (
                <>
                  <div className="hidden sm:block">
                    <table className="w-full border-collapse mb-6">
                      <thead>
                        <tr>
                          <th className="border p-2 text-left">Condition</th>
                          <th className="border p-2 text-left">Description</th>
                          <th className="border p-2 text-left">Date Added</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conditions.map((condition) => (
                          <tr key={condition.id}>
                            <td className="border p-2 font-medium">
                              {condition.name}
                            </td>
                            <td className="border p-2">
                              {condition.description ||
                                "No description provided"}
                            </td>
                            <td className="border p-2 whitespace-nowrap">
                              {condition.createdAt
                                ? new Date(
                                    condition.createdAt.toDate()
                                  ).toLocaleDateString()
                                : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile view: Cards for conditions */}
                  <div className="sm:hidden space-y-4">
                    {conditions.map((condition) => (
                      <div key={condition.id} className="border rounded-md p-3">
                        <div className="font-medium">{condition.name}</div>
                        {condition.description && (
                          <div className="text-sm mt-1 text-muted-foreground">
                            {condition.description}
                          </div>
                        )}
                        <div className="text-xs mt-2 text-muted-foreground">
                          Added:{" "}
                          {condition.createdAt
                            ? new Date(
                                condition.createdAt.toDate()
                              ).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center p-6 bg-slate-50 rounded-md">
                  <p className="text-muted-foreground">
                    No conditions recorded.
                  </p>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            <div className="section">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Pill className="mr-2 h-5 w-5 text-muted-foreground" />
                Current Treatments ({treatments.length})
              </h2>

              {treatments.length > 0 ? (
                <>
                  {/* Desktop view: Table for treatments */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-2 text-left">Treatment</th>
                          <th className="border p-2 text-left">Type</th>
                          <th className="border p-2 text-left">Frequency</th>
                          <th className="border p-2 text-left">
                            For Condition
                          </th>
                          <th className="border p-2 text-left">
                            Effectiveness
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {treatments.map((treatment) => (
                          <tr key={treatment.id}>
                            <td className="border p-2 font-medium">
                              {treatment.name}
                            </td>
                            <td className="border p-2">
                              {treatment.type === "pharmaceutical"
                                ? "Medication"
                                : "Lifestyle"}
                            </td>
                            <td className="border p-2 capitalize">
                              {treatment.frequency}
                            </td>
                            <td className="border p-2">
                              {treatment.conditionName}
                            </td>
                            <td className="border p-2">
                              {treatment.effectiveness ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  {treatment.effectiveness}/10
                                </Badge>
                              ) : (
                                "Not rated"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile view: Cards for treatments */}
                  <div className="sm:hidden space-y-4">
                    {treatments.map((treatment) => (
                      <div key={treatment.id} className="border rounded-md p-3">
                        <div className="font-medium">{treatment.name}</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {treatment.type === "pharmaceutical"
                              ? "Medication"
                              : "Lifestyle"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {treatment.frequency}
                          </Badge>
                          {treatment.effectiveness && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                              Rated: {treatment.effectiveness}/10
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm mt-2">
                          <span className="text-muted-foreground">For:</span>{" "}
                          {treatment.conditionName}
                        </div>
                        {treatment.notes && (
                          <div className="text-sm mt-2 text-muted-foreground line-clamp-2">
                            <span className="font-medium">Notes:</span>{" "}
                            {treatment.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center p-6 bg-slate-50 rounded-md">
                  <p className="text-muted-foreground">
                    No treatments recorded.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
              <p>This report was generated by Holistic Health Tracker.</p>
              <p>
                For medical advice, please consult with your healthcare
                provider.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
