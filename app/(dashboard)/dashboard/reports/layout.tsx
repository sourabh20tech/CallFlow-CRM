import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute roles={["admin", "agent"]}>{children}</ProtectedRoute>;
}
