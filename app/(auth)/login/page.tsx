import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { RedirectIfAuthenticated } from "@/components/auth/redirect-if-authenticated";
import { SessionLoading } from "@/components/auth/session-loading";

export const metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<SessionLoading variant="minimal" />}>
      <RedirectIfAuthenticated>
        <LoginForm />
      </RedirectIfAuthenticated>
    </Suspense>
  );
}
