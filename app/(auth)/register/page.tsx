import Link from "next/link";
import { GlassCard } from "@/components/design-system/glass-card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <GlassCard variant="strong" padding="lg" className="w-full max-w-md text-center ds-animate-scale">
      <h1 className="ds-h2">Create account</h1>
      <p className="ds-body mt-2 text-muted-foreground">
        Registration form ready — wire to Supabase Auth when your project is configured.
      </p>
      <Button asChild variant="premium" className="mt-6">
        <Link href="/login">Back to sign in</Link>
      </Button>
    </GlassCard>
  );
}
