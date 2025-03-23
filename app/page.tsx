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
import {
  Activity,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Heart,
  LineChart,
} from "lucide-react";
import Link from "next/link";
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

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

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
      {/* Navbar */}
      <nav className="py-4 px-6 sm:px-8 lg:px-12 bg-white/95 shadow-sm sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline-block">
              Holistic Health Tracker
            </span>
            <span className="font-bold text-lg sm:hidden">HHT</span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm hidden sm:flex"
              onClick={() => setActiveTab("signin")}
            >
              Sign In
            </Button>
            <Button
              size="sm"
              className="text-sm"
              onClick={() => setActiveTab("signup")}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row">
        {/* Left side - Branding & Features */}
        <div className="lg:flex-1 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 sm:p-8 lg:p-12 text-white lg:min-h-[calc(100vh-64px)]">
          <div className="max-w-xl mx-auto lg:mx-0 lg:ml-auto">
            <div className="py-10 lg:py-20">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                Track Your Health Journey, Holistically
              </h1>
              <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-indigo-100 leading-relaxed max-w-lg">
                Manage all your health treatments in one place—from
                prescriptions and therapies to diet changes and exercises.
              </p>
            </div>

            <div className="space-y-6 mb-10 lg:mb-0">
              <div className="flex items-start">
                <div className="bg-white/10 p-3 rounded-full mr-4 shrink-0">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Comprehensive Tracking
                  </h3>
                  <p className="text-indigo-100 text-sm sm:text-base">
                    Monitor medications, supplements, therapies and lifestyle
                    changes in one unified platform
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-white/10 p-3 rounded-full mr-4 shrink-0">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Treatment Effectiveness
                  </h3>
                  <p className="text-indigo-100 text-sm sm:text-base">
                    Rate and review what works best for your specific conditions
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-white/10 p-3 rounded-full mr-4 shrink-0">
                  <LineChart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Adherence Tracking
                  </h3>
                  <p className="text-indigo-100 text-sm sm:text-base">
                    Track your treatment adherence and identify patterns over
                    time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Forms */}
        <div className="lg:flex-1 p-6 sm:p-8 lg:p-12 flex flex-col justify-center bg-gray-50">
          <div className="w-full max-w-md mx-auto">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
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
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="signin-password">Password</Label>
                          <Button variant="link" className="p-0 h-auto text-xs">
                            Forgot password?
                          </Button>
                        </div>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="••••••••"
                          value={signinPassword}
                          onChange={(e) => setSigninPassword(e.target.value)}
                          required
                          className="h-10"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-10"
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
                          className="h-10"
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
                          className="h-10"
                        />
                        <p className="text-xs text-muted-foreground">
                          Must be at least 6 characters
                        </p>
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
                          className="h-10"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-10"
                        disabled={signingUp}
                      >
                        {signingUp ? "Creating account..." : "Create Account"}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        By creating an account, you agree to our
                        <Button
                          variant="link"
                          className="p-0 h-auto text-xs mx-1"
                        >
                          Terms of Service
                        </Button>
                        and
                        <Link
                          href="/privacy"
                          className="text-primary hover:underline text-xs ml-1"
                        >
                          Privacy Policy
                        </Link>
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-16 px-6 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Track your health treatments and monitor their effectiveness in
              three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Add Health Conditions",
                description:
                  "Start by adding your health conditions that you want to manage.",
                icon: <Activity className="h-10 w-10 text-primary" />,
                number: "1",
              },
              {
                title: "Track Treatments",
                description:
                  "Add medications, supplements, or lifestyle changes for each condition.",
                icon: <Heart className="h-10 w-10 text-primary" />,
                number: "2",
              },
              {
                title: "Monitor Effectiveness",
                description:
                  "Rate how well each treatment works and view trends over time.",
                icon: <LineChart className="h-10 w-10 text-primary" />,
                number: "3",
              },
            ].map((step, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-6 relative">
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                  {step.number}
                </div>
                <div className="mb-4 flex justify-center">{step.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-center">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-center">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button
              size="lg"
              className="group"
              onClick={() => setActiveTab("signup")}
            >
              Start Your Health Journey
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-50 py-16 px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about Holistic Health Tracker
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "How is my data handled?",
                answer:
                  "Your data is stored in a secure Firebase database. You should review Firebase's privacy policy for details on data handling practices.",
              },
              {
                question:
                  "Can I track both prescription medications and alternative therapies?",
                answer:
                  "Yes! The app is designed to track any type of treatment, from prescription medications to supplements, physical therapies, diet changes, and more.",
              },
              {
                question: "Is there a mobile app available?",
                answer:
                  "Currently, we offer a responsive web application that works on all devices.",
              },
              {
                question: "Can I export my health data?",
                answer:
                  "Yes, you can generate and download reports of your health conditions, treatments, and effectiveness ratings to share with your healthcare providers.",
              },
            ].map((faq, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="p-4 sm:p-6 hover:bg-slate-100 w-full text-left transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">{faq.question}</h3>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                        expandedFaq === i ? "transform rotate-180" : ""
                      }`}
                    />
                  </div>

                  {expandedFaq === i && (
                    <div className="mt-4 text-muted-foreground text-sm animate-fadeIn">
                      {faq.answer}
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/90 to-indigo-600 text-white py-16 px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Start Your Health Journey Today
          </h2>
          <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
            Take control of your health with comprehensive tracking and
            insightful analytics.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="font-semibold"
            onClick={() => setActiveTab("signup")}
          >
            Create Your Free Account
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-6 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="h-6 w-6 text-primary" />
                <span className="font-bold text-white">
                  Holistic Health Tracker
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Your all-in-one solution for tracking health treatments and
                their effectiveness.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">App</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            <p>
              © {new Date().getFullYear()} Holistic Health Tracker. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Sign Up Prompt */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4 flex justify-center z-20">
        <Button className="w-full" onClick={() => setActiveTab("signup")}>
          Get Started
        </Button>
      </div>
    </main>
  );
}
