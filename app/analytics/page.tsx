"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function AnalyticsPage() {
  const [user, setUser] = useState<any>(null);
  const [adherenceData, setAdherenceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchAdherenceData(user.uid);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchAdherenceData = async (userId: string) => {
    setLoading(true);

    try {
      // Get all user's treatments
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
          adherence: adherenceRate,
          completed: completedForDay,
          total: totalForDay,
        };
      });

      setAdherenceData(chartData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Treatment Analytics</h1>

      <Card>
        <CardHeader>
          <CardTitle>Treatment Adherence (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adherenceData}>
                <XAxis dataKey="day" />
                <YAxis
                  label={{
                    value: "Adherence %",
                    angle: -90,
                    position: "insideLeft",
                  }}
                  domain={[0, 100]}
                />
                <Tooltip
                  formatter={(value, name, props) => [`${value}%`, "Adherence"]}
                  labelFormatter={(label) => `Day: ${label}`}
                />
                <Bar dataKey="adherence" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {adherenceData.map((day, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <p className="text-lg font-medium">{day.day}</p>
                  <p className="text-2xl font-bold">{day.adherence}%</p>
                  <p className="text-sm text-muted-foreground">
                    {day.completed} of {day.total} treatments
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
