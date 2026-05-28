import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-[420px] w-full max-w-md rounded-2xl" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
