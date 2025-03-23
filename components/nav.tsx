"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  BarChart3,
  ClipboardList,
  FilePieChart,
  Home,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Don't show navbar on login page
  if (pathname === "/" && !user) {
    return null;
  }

  // If on home page but authenticated, redirect to dashboard
  if (pathname === "/" && user) {
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

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-4 w-4 mr-2" />,
    },
    {
      name: "Conditions",
      href: "/conditions",
      icon: <User className="h-4 w-4 mr-2" />,
    },
    {
      name: "Treatments",
      href: "/treatments",
      icon: <ClipboardList className="h-4 w-4 mr-2" />,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: <BarChart3 className="h-4 w-4 mr-2" />,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: <FilePieChart className="h-4 w-4 mr-2" />,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <Settings className="h-4 w-4 mr-2" />,
    },
  ];

  const NavLink = ({ item }: { item: (typeof navItems)[0] }) => (
    <Link
      href={item.href}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        pathname === item.href
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted"
      }`}
      onClick={() => setMobileMenuOpen(false)}
    >
      {item.icon}
      {item.name}
    </Link>
  );

  return (
    <nav className="border-b py-2 bg-background sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo and Desktop Navigation */}
        <div className="flex items-center">
          <Link
            href={user ? "/dashboard" : "/"}
            className="text-xl font-bold mr-4 md:mr-8"
            onClick={handleLogoClick}
          >
            Holistic Health
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Right Side - User Menu & Mobile Toggle */}
        <div className="flex items-center space-x-2">
          {user && (
            <>
              {/* User Menu - Desktop */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <span className="hidden sm:inline-block">
                        {user.email?.split("@")[0]}
                      </span>
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="h-4 w-4 mr-2" /> Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut(auth)}>
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && mobileMenuOpen && (
        <div className="md:hidden container mx-auto pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
          <div
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 cursor-pointer"
            onClick={() => signOut(auth)}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </div>
        </div>
      )}
    </nav>
  );
}
