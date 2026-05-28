import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/design-system/glass-card";
import { BrandMark } from "@/components/shared/brand-mark";
import { APP_NAME } from "@/constants/app";

export default function NotFound() {
  return (
    <div className="mesh-gradient flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12">
      <GlassCard variant="gradient" padding="lg" className="w-full max-w-md text-center">
        <BrandMark size="md" className="mx-auto mb-4" />
        <p className="ds-overline mb-2">404</p>
        <h1 className="ds-h2">Page not found</h1>
        <p className="ds-body mt-2 text-muted-foreground">
          This URL does not exist in {APP_NAME}. Check the address or go back to the app.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="premium">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
