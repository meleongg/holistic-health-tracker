"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { CheckCircle, Heart, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("signin");

  // Sign-in form state
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  // Sign-up form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signingUp, setSigningUp] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signinEmail || !signinPassword) {
      toast.error("Please enter both email and password");
      return;
    }

    setSigningIn(true);
    try {
      await signInWithEmailAndPassword(auth, signinEmail, signinPassword);
      toast.success("Signed in successfully");
      router.push("/dashboard");
    } catch (error: any) {
      const errorMessage =
        error.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : error.message || "Failed to sign in";
      toast.error(errorMessage);
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword) {
      toast.error("Please enter email and password");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (signupPassword.length < 6) {
      toast.error("Password should be at least 6 characters");
      return;
    }

    setSigningUp(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupEmail,
        signupPassword
      );

      // Create a user profile in Firestore
      await setDoc(doc(db, "userProfiles", userCredential.user.uid), {
        email: signupEmail,
        createdAt: new Date(),
        reminderTime: "20:00",
        reminderFrequency: "daily",
        enableEmailReminders: true,
      });

      toast.success("Account created successfully");
      router.push("/dashboard");
    } catch (error: any) {
      let errorMessage = "Failed to create account";

      if (error.code === "auth/email-already-in-use") {
        errorMessage =
          "This email is already registered. Please sign in instead.";
      }

      toast.error(errorMessage);
    } finally {
      setSigningUp(false);
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, don't render the login page at all
  if (user) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left side - Branding & Features */}
        <div className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-600 p-8 lg:p-12 text-white flex flex-col justify-center">
          <div className="max-w-xl mx-auto lg:mx-0 lg:ml-auto">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Holistic Health Tracker
            </h1>
            <p className="text-xl mb-8 text-indigo-100">
              Track and manage all your health treatments in one place, from
              prescriptions to lifestyle changes.
            </p>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-white/10 p-3 rounded-full mr-4">
                  <Heart className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Comprehensive Tracking
                  </h3>
                  <p className="text-indigo-100">
                    Monitor both medical and alternative treatments in one
                    unified platform
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-white/10 p-3 rounded-full mr-4">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Treatment Effectiveness
                  </h3>
                  <p className="text-indigo-100">
                    Rate and review what works best for your specific conditions
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-white/10 p-3 rounded-full mr-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    AI-Powered Suggestions
                  </h3>
                  <p className="text-indigo-100">
                    Get personalized treatment recommendations based on your
                    conditions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Forms */}
        <div className="flex-1 p-8 lg:p-12 flex items-center justify-center bg-gray-50">
          <div className="w-full max-w-md">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>

              {/* Sign In Form */}
              <TabsContent value="signin">
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>
                      Sign in to your account to continue your health journey
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="your@email.com"
                          value={signinEmail}
                          onChange={(e) => setSigninEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="••••••••"
                          value={signinPassword}
                          onChange={(e) => setSigninPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={signingIn}
                      >
                        {signingIn ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sign Up Form */}
              <TabsContent value="signup">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>
                      Sign up to start tracking your health journey
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password">
                          Confirm Password
                        </Label>
                        <Input
                          id="signup-confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupConfirmPassword}
                          onChange={(e) =>
                            setSignupConfirmPassword(e.target.value)
                          }
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={signingUp}
                      >
                        {signingUp ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  );
}
