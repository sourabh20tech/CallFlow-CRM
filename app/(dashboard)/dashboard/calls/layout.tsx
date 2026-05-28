import { ProtectedRoute } from "@/components/auth/protected-route";

export default function CallsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute roles={["admin", "agent"]}>{children}</ProtectedRoute>;
}
