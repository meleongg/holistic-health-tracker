"use client";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Don't show navbar on login page
  if (pathname === "/" && user) {
    // If on home page but authenticated, redirect to dashboard
    router.replace("/dashboard");
    return null;
  }

  const handleLogoClick = (e: React.MouseEvent) => {
    if (user) {
      e.preventDefault();
      router.push("/dashboard");
    }
    // If not authenticated, normal link behavior to "/"
  };

  return (
    <nav className="border-b py-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={user ? "/dashboard" : "/"}
            className="text-xl font-bold"
            onClick={handleLogoClick}
          >
            Holistic Health Tracker
          </Link>

          {user && (
            <div className="flex space-x-4">
              <Link
                href="/dashboard"
                className={`px-2 py-1 ${
                  pathname === "/dashboard" ? "text-blue-600 font-medium" : ""
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/conditions"
                className={`px-2 py-1 ${
                  pathname === "/conditions" ? "text-blue-600 font-medium" : ""
                }`}
              >
                Conditions
              </Link>
              <Link
                href="/treatments"
                className={`px-2 py-1 ${
                  pathname === "/treatments" ? "text-blue-600 font-medium" : ""
                }`}
              >
                Treatments
              </Link>
            </div>
          )}
        </div>

        {user && (
          <Button variant="outline" onClick={() => signOut(auth)}>
            Sign Out
          </Button>
        )}
      </div>
    </nav>
  );
}
