import { AuthProvider } from "@/contexts/auth-context";
import type { Metadata, Viewport } from "next"; // Import Viewport type
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Navigation component
import Nav from "@/components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Separate viewport configuration
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#1e293b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// Regular metadata configuration (without themeColor and viewport)
export const metadata: Metadata = {
  title: "Holistic Health Tracker | Track All Your Treatments",
  description:
    "Manage your health journey with our comprehensive holistic health tracking application. Track medications, lifestyle changes, and treatment effectiveness all in one place.",
  keywords: [
    "health tracker",
    "holistic health",
    "treatment management",
    "medication tracker",
    "health app",
  ],
  authors: [{ name: "Melvin Teo" }],
  creator: "Melvin Teo",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://holistic-health-tracker.vercel.app/",
    title: "Holistic Health Tracker",
    description:
      "Your all-in-one solution for tracking medical and alternative treatments",
    siteName: "Holistic Health Tracker",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Nav />
          <main className="container mx-auto px-4 py-6">{children}</main>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
