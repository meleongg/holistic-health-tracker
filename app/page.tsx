"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [testInput, setTestInput] = useState("");
  const [firestoreData, setFirestoreData] = useState<string[]>([]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Test Firebase Authentication
  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Signed in successfully");
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Test Firestore
  const addToFirestore = async () => {
    if (!testInput) return;

    try {
      const docRef = await addDoc(collection(db, "testCollection"), {
        text: testInput,
        createdAt: new Date(),
      });
      console.log("Document written with ID:", docRef.id);
      setTestInput("");
      fetchFirestoreData();
    } catch (error) {
      console.error("Error adding document:", error);
    }
  };

  const fetchFirestoreData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "testCollection"));
      const data: string[] = [];
      querySnapshot.forEach((doc) => {
        data.push(doc.data().text);
      });
      setFirestoreData(data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchFirestoreData();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Tech Stack Test</h1>

        <Card>
          <CardHeader>
            <CardTitle>Firebase Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!user ? (
              <>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button onClick={handleSignIn} className="w-full">
                  Sign In
                </Button>
              </>
            ) : (
              <>
                <p className="text-green-500">Signed in as: {user.email}</p>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full"
                >
                  Sign Out
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Firestore Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter test data"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
              />
              <Button onClick={addToFirestore}>Add</Button>
            </div>
            <div className="border rounded-md p-4 h-40 overflow-y-auto">
              <h3 className="font-medium mb-2">Stored Data:</h3>
              {firestoreData.length > 0 ? (
                <ul className="space-y-1">
                  {firestoreData.map((item, index) => (
                    <li key={index} className="text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">
                  No data yet. Add something!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
