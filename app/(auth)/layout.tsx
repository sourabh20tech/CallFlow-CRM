import Image from "next/image";
import { APP_NAME } from "@/constants/app";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] bg-[#0a0a0f]">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 50% at 25% 50%, rgba(139,92,246,0.04), transparent),
            radial-gradient(ellipse 50% 50% at 75% 50%, rgba(99,102,241,0.03), transparent)
          `,
        }}
        aria-hidden
      />

      {/* LEFT - Illustration (hidden on mobile, shown on lg+) */}
      <div className="relative hidden flex-1 items-center justify-center lg:flex">
        {/* Glow behind illustration */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative z-10 w-full max-w-lg px-12 animate-[fade-in_0.8s_ease-out]">
          <Image
            src="/login-illustration.svg"
            alt="CallFlow CRM - Enterprise Call Center Management Platform"
            width={600}
            height={500}
            priority
            className="h-auto w-full drop-shadow-2xl"
          />
        </div>
      </div>

      {/* RIGHT - Login Form */}
      <div className="relative flex w-full flex-col items-center justify-center px-4 py-8 sm:px-8 lg:w-[520px] lg:min-w-[520px] xl:w-[560px]">
        {/* Subtle left border on desktop */}
        <div className="absolute inset-y-0 left-0 hidden w-px bg-gradient-to-b from-transparent via-purple-500/20 to-transparent lg:block" aria-hidden />

        {/* Mobile illustration (shown only on mobile/tablet) */}
        <div className="mb-8 w-full max-w-[280px] lg:hidden">
          <Image
            src="/login-illustration.svg"
            alt="CallFlow CRM"
            width={280}
            height={233}
            className="h-auto w-full opacity-80"
          />
        </div>

        {/* Brand */}
        <div className="relative z-10 mb-6 flex flex-col items-center gap-2 text-center sm:mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">{APP_NAME}</h1>
          <p className="text-xs text-zinc-500">Professional Call Center Management</p>
        </div>

        {/* Login card */}
        <div className="relative z-10 w-full max-w-md">
          {children}
        </div>

        {/* Footer */}
        <p className="relative z-10 mt-8 text-center text-[11px] text-zinc-600">
          © 2026 VRSH GOUD SERVICES · CallFlow CRM
        </p>
      </div>

      {/* Fade-in animation */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
