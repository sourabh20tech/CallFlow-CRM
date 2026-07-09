import Image from "next/image";
import { APP_NAME } from "@/constants/app";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mobile + Tablet: single column, natural height, scrollable if needed */}
      <div className="flex min-h-[100dvh] flex-col items-center bg-[#09090f] px-4 py-6 lg:hidden">
        {/* Bulb */}
        <div className="mb-3 flex flex-col items-center" aria-hidden>
          <div className="h-5 w-[1.5px] bg-zinc-700" />
          <div className="h-2 w-3 rounded-b bg-zinc-700" />
          <div className="h-5 w-4 rounded-b-full bg-gradient-to-b from-white/70 to-white/25 shadow-[0_0_8px_3px_rgba(255,255,255,0.08)]" />
        </div>

        {/* Brand */}
        <div className="mb-2 flex flex-col items-center gap-1 text-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03]">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-sm font-bold text-white">{APP_NAME}</h1>
          <p className="text-[10px] text-zinc-500">Call Center Management</p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[420px]">
          {children}
        </div>

        <p className="mt-4 text-[9px] text-zinc-600">© 2026 VRSH GOUD SERVICES</p>
      </div>

      {/* Desktop: two-column layout */}
      <div className="relative hidden h-[100dvh] overflow-hidden bg-[#09090f] lg:flex">
        {/* Ambient */}
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 40% 35% at 30% 50%, rgba(139,92,246,0.04), transparent), radial-gradient(ellipse 35% 30% at 70% 50%, rgba(99,102,241,0.03), transparent)" }} aria-hidden />

        {/* Bulb */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2" aria-hidden>
          <div className="flex flex-col items-center">
            <div className="h-[5vh] w-[2px] bg-gradient-to-b from-zinc-600 to-zinc-800" />
            <div className="h-3 w-4 rounded-b-md bg-gradient-to-b from-zinc-600 to-zinc-800" />
            <div className="relative">
              <div className="h-8 w-6 rounded-b-full bg-gradient-to-b from-white/80 to-white/30" style={{ boxShadow: "0 0 12px 5px rgba(255,255,255,0.1), 0 0 35px 12px rgba(255,255,255,0.05)" }} />
              <div className="absolute -inset-6 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)", animation: "bulb-breathe 4s ease-in-out infinite" }} />
            </div>
          </div>
        </div>

        {/* Left: Illustration */}
        <div className="relative flex flex-1 items-center justify-center">
          <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 65%)" }} aria-hidden />
          <div className="relative z-10 w-[clamp(300px,40vw,500px)] px-8" style={{ animation: "float 6s ease-in-out infinite" }}>
            <Image src="/login-illustration.svg" alt="CallFlow CRM" width={500} height={417} priority className="h-auto w-full drop-shadow-[0_0_25px_rgba(139,92,246,0.1)]" />
          </div>
        </div>

        {/* Right: Login */}
        <div className="relative z-10 flex w-[clamp(400px,38%,500px)] flex-col items-center justify-center px-8">
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-violet-500/15 to-transparent" aria-hidden />

          <div className="mb-5 flex flex-col items-center gap-1.5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white">{APP_NAME}</h1>
            <p className="text-[11px] text-zinc-500">Professional Call Center Management</p>
          </div>

          <div className="w-full max-w-[440px]">
            {children}
          </div>

          <p className="mt-5 text-[10px] text-zinc-600">© 2026 VRSH GOUD SERVICES</p>
        </div>

        <style>{`
          @keyframes bulb-breathe { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
          @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        `}</style>
      </div>
    </>
  );
}
