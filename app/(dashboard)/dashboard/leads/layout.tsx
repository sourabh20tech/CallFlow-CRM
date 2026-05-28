import { ProtectedRoute } from "@/components/auth/protected-route";

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute roles={["admin", "agent"]}>{children}</ProtectedRoute>;
}
