"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function AnalyticsPage() {
  const [user, setUser] = useState<any>(null);
  const [adherenceData, setAdherenceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("weekly");
  const [timeRange, setTimeRange] = useState<string>("7");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7); // Show 7 days per page
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchAdherenceData(user.uid, parseInt(timeRange));
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router, timeRange]);

  useEffect(() => {
    setCurrentPage(1);
  }, [timeRange]);

  const fetchAdherenceData = async (userId: string, days: number = 7) => {
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

      // Calculate adherence by day (for specified number of days)
      const dates = [];
      for (let i = days - 1; i >= 0; i--) {
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

      setAdherenceData(chartData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

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

  // Get trend compared to previous week
  const getTrendIndicator = () => {
    const currentAvg = calculateOverallAdherence();
    // Placeholder for previous week - in a real app you'd fetch this
    const prevWeekAvg = currentAvg - 5 + Math.floor(Math.random() * 10);

    if (currentAvg > prevWeekAvg)
      return { label: "Improving", color: "text-green-500" };
    if (currentAvg < prevWeekAvg)
      return { label: "Declining", color: "text-red-500" };
    return { label: "Stable", color: "text-blue-500" };
  };

  const getAdherenceStatus = (adherence: number) => {
    if (adherence >= 80)
      return { text: "Excellent", color: "bg-green-100 text-green-800" };
    if (adherence >= 60)
      return { text: "Good", color: "bg-blue-100 text-blue-800" };
    if (adherence >= 40)
      return { text: "Fair", color: "bg-yellow-100 text-yellow-800" };
    return { text: "Needs Improvement", color: "bg-red-100 text-red-800" };
  };

  const handleTimeRangeChange = (days: string) => {
    setTimeRange(days);
    if (user) {
      fetchAdherenceData(user.uid, parseInt(days));
    }
  };

  const totalPages = Math.ceil(adherenceData.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Treatment Analytics</h1>

        <div className="flex items-center mt-2 sm:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 text-sm h-9">
                {timeRange === "7"
                  ? "Last 7 Days"
                  : timeRange === "14"
                  ? "Last 14 Days"
                  : timeRange === "30"
                  ? "Last 30 Days"
                  : timeRange === "90"
                  ? "Last 90 Days"
                  : `Last ${timeRange} Days`}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleTimeRangeChange("7")}>
                Last 7 Days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeRangeChange("14")}>
                Last 14 Days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeRangeChange("30")}>
                Last 30 Days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTimeRangeChange("90")}>
                Last 90 Days
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Weekly Adherence
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {calculateOverallAdherence()}%
                </h3>
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <div className={`${getTrendIndicator().color} flex items-center`}>
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>{getTrendIndicator().label}</span>
              </div>
              <span className="text-muted-foreground ml-2">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Best Day
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {adherenceData.length > 0
                    ? adherenceData.reduce(
                        (max, day) =>
                          day.adherence > max.adherence ? day : max,
                        adherenceData[0]
                      ).day
                    : "N/A"}
                </h3>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <CalendarIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {adherenceData.length > 0
                ? `${
                    adherenceData.reduce(
                      (max, day) => (day.adherence > max.adherence ? day : max),
                      adherenceData[0]
                    ).adherence
                  }% completion rate`
                : "No data available"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {getAdherenceStatus(calculateOverallAdherence()).text}
                </h3>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Based on your overall adherence rate
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Treatment Adherence (Last {timeRange} Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex justify-end mb-4">
              <TabsList className="grid w-full sm:w-auto grid-cols-2 h-8">
                <TabsTrigger value="weekly" className="text-xs">
                  Weekly
                </TabsTrigger>
                <TabsTrigger value="daily" className="text-xs">
                  Daily
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="weekly" className="m-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={adherenceData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      domain={[0, 100]}
                      tickFormatter={(tick) => `${tick}%`}
                    />
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value}%`,
                        "Adherence",
                      ]}
                      labelFormatter={(label) => `Day: ${label}`}
                      contentStyle={{
                        borderRadius: "6px",
                        padding: "8px 12px",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <Bar
                      dataKey="adherence"
                      fill="#4f46e5"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="daily" className="m-0">
              <div className="space-y-6">
                {/* Pagination indicator */}
                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                  <span>
                    Showing{" "}
                    {Math.min(
                      (currentPage - 1) * itemsPerPage + 1,
                      adherenceData.length
                    )}{" "}
                    to{" "}
                    {Math.min(currentPage * itemsPerPage, adherenceData.length)}{" "}
                    of {adherenceData.length} days
                  </span>
                </div>

                {/* Paginated data */}
                {adherenceData
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )
                  .map((day, i) => {
                    const status = getAdherenceStatus(day.adherence);
                    return (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                <span className="font-bold">{day.day}</span>
                              </div>
                              <div>
                                <p className="font-medium">{day.date}</p>
                                <p className="text-sm text-muted-foreground">
                                  {day.completed} of {day.total} treatments
                                </p>
                              </div>
                            </div>

                            <Badge
                              className={`${status.color} self-start sm:self-auto mt-2 sm:mt-0`}
                            >
                              {status.text}
                            </Badge>
                          </div>

                          <div className="mt-3 sm:mt-0">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 sm:w-32">
                                <div
                                  className="bg-primary h-2.5 rounded-full"
                                  style={{ width: `${day.adherence}%` }}
                                ></div>
                              </div>
                              <span className="font-bold">
                                {day.adherence}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="hidden sm:flex items-center justify-center h-8 w-8 p-0"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center text-sm">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          // Show a window of 5 pages centered on the current page
                          let pageNum;
                          if (totalPages <= 5) {
                            // If 5 or fewer pages, show all
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            // If near start, show first 5 pages
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            // If near end, show last 5 pages
                            pageNum = totalPages - 4 + i;
                          } else {
                            // Otherwise show window around current page
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="h-8 w-8 p-0 mx-1"
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="hidden sm:flex items-center justify-center h-8 w-8 p-0"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
