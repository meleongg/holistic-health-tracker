import { AuthProvider } from "@/contexts/auth-context";
import type { Metadata } from "next";
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
  authors: [{ name: "Your Name" }],
  creator: "Your Name or Company",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#1e293b" },
  ],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://your-domain.com/",
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
