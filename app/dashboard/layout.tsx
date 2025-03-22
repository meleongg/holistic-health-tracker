import Nav from "@/components/nav"; // Your navigation component
import ProtectedRoute from "@/components/protected-route";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <Nav />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </ProtectedRoute>
  );
}
