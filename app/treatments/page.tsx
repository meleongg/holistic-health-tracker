"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  GroupIcon,
  ListIcon,
  Loader2,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Define interfaces for your data structures
interface Treatment {
  id: string;
  name: string;
  type: string;
  frequency: string;
  conditionId: string;
  conditionName: string;
  effectiveness?: number;
  userId: string;
  createdAt: any; // or Date if you're converting the Firestore timestamp
}

interface Condition {
  id: string;
  name: string;
  description?: string;
  userId: string;
}

export default function TreatmentsPage() {
  const [user, setUser] = useState<any>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [selectedCondition, setSelectedCondition] = useState("");
  const [treatmentName, setTreatmentName] = useState("");
  const [treatmentType, setTreatmentType] = useState("pharmaceutical");
  const [frequency, setFrequency] = useState("daily");
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [conditionsLoading, setConditionsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [filterCondition, setFilterCondition] = useState("all");
  const [viewType, setViewType] = useState<"list" | "grouped">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const treatmentsPerPage = 5;
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
    setConditionsLoading(true);
    try {
      const conditionsQuery = query(
        collection(db, "conditions"),
        where("userId", "==", userId)
      );

      const snapshot = await getDocs(conditionsQuery);
      const conditionsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Condition[]; // Add this type assertion

      setConditions(conditionsList);
    } catch (error) {
      console.error("Error fetching conditions:", error);
      toast.error("Failed to load conditions");
    } finally {
      setConditionsLoading(false);
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
      })) as Treatment[]; // Add this type assertion

      setTreatments(treatmentsList);
    } catch (error) {
      console.error("Error fetching treatments:", error);
      toast.error("Failed to load treatments");
    } finally {
      setLoading(false);
    }
  };

  const fetchTreatmentSuggestions = async (conditionId: string) => {
    setLoadingSuggestions(true);

    try {
      const condition = conditions.find((c) => c.id === conditionId);
      if (!condition) return;

      const response = await fetch("/api/treatment-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conditionName: condition.name,
          description: condition.description || "",
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch suggestions");

      const data = await response.json();

      // Check if data.suggestions exists, otherwise use an empty array or the whole data
      const suggestionsData = data.suggestions || [];

      setSuggestions(suggestionsData);
    } catch (error) {
      console.error("Error fetching treatment suggestions:", error);
      toast.error("Failed to load suggestions");
    } finally {
      setLoadingSuggestions(false);
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

  const filteredTreatments = useMemo(() => {
    return filterCondition === "all"
      ? treatments
      : treatments.filter((t) => t.conditionId === filterCondition);
  }, [treatments, filterCondition]);

  const pageCount = Math.ceil(filteredTreatments.length / treatmentsPerPage);
  const currentTreatments = useMemo(() => {
    const startIndex = (currentPage - 1) * treatmentsPerPage;
    return filteredTreatments.slice(startIndex, startIndex + treatmentsPerPage);
  }, [filteredTreatments, currentPage, treatmentsPerPage]);

  const groupedTreatments = useMemo(() => {
    return filteredTreatments.reduce<Record<string, Treatment[]>>(
      (acc, treatment) => {
        const conditionId = treatment.conditionId;
        if (!acc[conditionId]) {
          acc[conditionId] = [];
        }
        acc[conditionId].push(treatment);
        return acc;
      },
      {}
    );
  }, [filteredTreatments]);

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
                onValueChange={(value) => {
                  setSelectedCondition(value);
                  if (value) fetchTreatmentSuggestions(value);
                }}
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

            {selectedCondition && (
              <div className="mt-4 border rounded-md p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">AI-Suggested Treatments</h3>
                  {loadingSuggestions && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                      Generating suggestions...
                    </div>
                  )}
                </div>

                {!loadingSuggestions && suggestions.length > 0 ? (
                  <ScrollArea className="h-[180px] pr-4">
                    <div className="space-y-3">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="border bg-white rounded-md p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => {
                            setTreatmentName(suggestion.name);
                            setTreatmentType(suggestion.type);
                            setFrequency(suggestion.frequency);
                            toast.success(`Added "${suggestion.name}" to form`);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">
                                {suggestion.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {suggestion.type === "pharmaceutical"
                                  ? "Medication"
                                  : "Lifestyle"}{" "}
                                {" • "}
                                {suggestion.frequency}
                              </div>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              Use
                            </Badge>
                          </div>
                          {suggestion.description && (
                            <p className="text-xs mt-2 text-muted-foreground">
                              {suggestion.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : !loadingSuggestions ? (
                  <p className="text-sm text-muted-foreground">
                    Select a condition to see AI-suggested treatments
                  </p>
                ) : null}
              </div>
            )}

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
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Treatments</h2>

          <div className="flex items-center space-x-2">
            {/* Filter dropdown */}
            <Select value={filterCondition} onValueChange={setFilterCondition}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                {conditions.map((condition) => (
                  <SelectItem key={condition.id} value={condition.id}>
                    {condition.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View type toggle */}
            <div className="border rounded-md flex">
              <Button
                variant={viewType === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewType("list")}
                className="rounded-r-none px-3"
              >
                <ListIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewType === "grouped" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewType("grouped")}
                className="rounded-l-none px-3"
              >
                <GroupIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTreatments.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-slate-50">
            <p className="text-muted-foreground">No treatments found.</p>
            {filterCondition !== "all" && (
              <p className="text-sm mt-1">
                Try changing your filter or{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => setFilterCondition("all")}
                >
                  view all treatments
                </Button>
              </p>
            )}
          </div>
        ) : viewType === "list" ? (
          // List view with pagination
          <>
            {currentTreatments.map((treatment) => (
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
                        onClick={() =>
                          router.push(`/treatments/${treatment.id}`)
                        }
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
            ))}

            {/* Pagination controls */}
            {filteredTreatments.length > treatmentsPerPage && (
              <div className="flex justify-center mt-6">
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(pageCount, p + 1))
                    }
                    disabled={currentPage === pageCount}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          // Grouped view by condition
          <div className="space-y-6">
            {Object.entries(groupedTreatments).map(
              ([conditionId, treatments]) => {
                const condition = conditions.find(
                  (c) => c.id === conditionId
                ) || { name: "Unknown Condition" };
                return (
                  <div key={conditionId} className="space-y-3">
                    <h3 className="font-medium text-lg border-b pb-2">
                      {condition.name}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({treatments.length} treatments)
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {treatments.map((treatment) => (
                        <div
                          key={treatment.id}
                          className="border rounded-md p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() =>
                            router.push(`/treatments/${treatment.id}`)
                          }
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">
                                {treatment.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {treatment.type === "pharmaceutical"
                                  ? "Medication"
                                  : "Lifestyle"}{" "}
                                • {treatment.frequency}
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/treatments/${treatment.id}`);
                                }}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTreatment(treatment.id);
                                }}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {treatment.effectiveness && (
                            <div className="mt-1 text-xs">
                              <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                                Rated: {treatment.effectiveness}/10
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}
