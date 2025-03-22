import ProtectedRoute from "@/components/protected-route";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </ProtectedRoute>
  );
}
