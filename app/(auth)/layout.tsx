import { APP_NAME } from "@/constants/app";
import { BrandMark } from "@/components/shared/brand-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-500/[0.08] via-transparent to-indigo-500/[0.06]"
        aria-hidden
      />
      <div className="relative mb-10 flex items-center gap-3.5 ds-animate-in sm:mb-12">
        <BrandMark size="md" className="hover:scale-105" />
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/90">
            VRSH GOUD SERVICES
          </p>
          <h2 className="ds-h2 leading-tight tracking-tight">{APP_NAME}</h2>
          <p className="ds-caption text-muted-foreground/90">Secure sign in to continue</p>
        </div>
      </div>
      <div className="relative w-full max-w-md ds-animate-scale sm:max-w-lg">{children}</div>
      <p className="ds-caption relative mt-8 text-center">Copyright © 2026 CallFlow CRM</p>
    </div>
  );
}
