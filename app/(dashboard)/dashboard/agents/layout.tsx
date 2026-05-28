import { ProtectedRoute } from "@/components/auth/protected-route";

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute roles="admin">{children}</ProtectedRoute>;
}
