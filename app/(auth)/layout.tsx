import Image from "next/image";
import { APP_NAME } from "@/constants/app";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full bg-[#09090f]">
      {/* ══════════ MOBILE & TABLET (< 1024px) ══════════ */}
      <div className="flex flex-col items-center px-4 py-6 lg:hidden">
        {/* Bulb */}
        <div className="mb-2 flex flex-col items-center" aria-hidden>
          <div className="h-4 w-[1.5px] bg-zinc-700" />
          <div className="h-1.5 w-2.5 rounded-b bg-zinc-700" />
          <div className="h-4 w-3.5 rounded-b-full bg-gradient-to-b from-white/70 to-white/25 shadow-[0_0_6px_2px_rgba(255,255,255,0.08)]" />
        </div>

        {/* Brand */}
        <div className="mb-3 flex flex-col items-center gap-0.5 text-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03]">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-sm font-bold text-white">{APP_NAME}</h1>
        </div>

        {/* Illustration (tablet: larger, mobile: compact) */}
        <div className="mb-4 w-[clamp(140px,40vw,240px)]">
          <Image src="/login-illustration.svg" alt="CallFlow CRM" width={240} height={200} className="h-auto w-full opacity-70" priority />
        </div>

        {/* Login Card */}
        <div className="w-[92%] max-w-[380px]">
          {children}
        </div>

        <p className="mt-4 text-[9px] text-zinc-600">© 2026 VRSH GOUD SERVICES</p>
      </div>

      {/* ══════════ DESKTOP (≥ 1024px) ══════════ */}
      <div className="hidden min-h-[100dvh] items-center justify-center lg:flex">
        {/* Centered container */}
        <div className="mx-auto grid w-[92%] max-w-[1400px] grid-cols-[60%_40%] items-center gap-8">

          {/* LEFT: Illustration (60%) */}
          <div className="flex items-center justify-center">
            <div className="relative w-[clamp(380px,85%,600px)]">
              {/* Ambient glow */}
              <div className="absolute inset-0 -m-12 rounded-full opacity-40" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)" }} aria-hidden />
              {/* Illustration */}
              <Image
                src="/login-illustration.svg"
                alt="CallFlow CRM - Enterprise Call Center Management"
                width={600}
                height={500}
                priority
                className="relative z-10 h-auto w-full drop-shadow-[0_0_30px_rgba(139,92,246,0.1)]"
                style={{ animation: "login-float 6s ease-in-out infinite" }}
              />
            </div>
          </div>

          {/* RIGHT: Login Card (40%) */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-[420px]">
              {/* Brand */}
              <div className="mb-5 flex flex-col items-center gap-1.5 text-center">
                {/* Bulb above brand */}
                <div className="mb-2 flex flex-col items-center" aria-hidden>
                  <div className="h-6 w-[1.5px] bg-zinc-700" />
                  <div className="h-2 w-3 rounded-b bg-zinc-700" />
                  <div className="relative">
                    <div className="h-6 w-5 rounded-b-full bg-gradient-to-b from-white/80 to-white/30 shadow-[0_0_10px_4px_rgba(255,255,255,0.1)]" />
                    <div className="absolute -inset-4 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)", animation: "login-breathe 4s ease-in-out infinite" }} />
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h1 className="text-lg font-bold text-white">{APP_NAME}</h1>
                <p className="text-[11px] text-zinc-500">Professional Call Center Management</p>
              </div>

              {/* Card */}
              {children}

              <p className="mt-5 text-center text-[10px] text-zinc-600">© 2026 VRSH GOUD SERVICES</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes login-breathe { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes login-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>
    </div>
  );
}
