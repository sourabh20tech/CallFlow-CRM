import Image from "next/image";
import { APP_NAME } from "@/constants/app";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-[#09090f] lg:flex-row">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 40% 35% at 30% 50%, rgba(139,92,246,0.04), transparent),
            radial-gradient(ellipse 35% 30% at 70% 50%, rgba(99,102,241,0.03), transparent),
            radial-gradient(ellipse 50% 40% at 50% 0%, rgba(255,255,255,0.015), transparent)
          `,
        }}
        aria-hidden
      />

      {/* Hanging Bulb */}
      <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2" aria-hidden>
        <div className="flex flex-col items-center">
          <div className="h-[clamp(25px,4vh,50px)] w-[2px] bg-gradient-to-b from-zinc-700 to-zinc-800" />
          <div className="h-2.5 w-3.5 rounded-b-md bg-gradient-to-b from-zinc-600 to-zinc-800" />
          <div className="relative">
            <div
              className="h-6 w-5 rounded-b-full bg-gradient-to-b from-white/80 via-white/60 to-white/30 sm:h-8 sm:w-6"
              style={{
                boxShadow: "0 0 12px 5px rgba(255,255,255,0.1), 0 0 35px 12px rgba(255,255,255,0.05)",
              }}
            />
            <div
              className="absolute -inset-5 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)",
                animation: "bulb-breathe 4s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </div>

      {/* Light cone */}
      <div
        className="pointer-events-none absolute left-1/2 top-[clamp(50px,8vh,90px)] z-10 -translate-x-1/2"
        style={{
          width: "min(600px, 90vw)",
          height: "clamp(120px, 25vh, 250px)",
          background: "radial-gradient(ellipse 45% 55% at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 70%)",
          animation: "bulb-breathe 4s ease-in-out infinite",
        }}
        aria-hidden
      />

      {/* LEFT: Illustration (desktop only) */}
      <div className="relative hidden flex-1 items-center justify-center lg:flex">
        <div
          className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 65%)" }}
          aria-hidden
        />
        <div className="relative z-10 w-[clamp(300px,45vw,520px)] px-6" style={{ animation: "float 6s ease-in-out infinite" }}>
          <Image
            src="/login-illustration.svg"
            alt="CallFlow CRM - Enterprise Call Center Management"
            width={520}
            height={433}
            priority
            className="h-auto w-full drop-shadow-[0_0_30px_rgba(139,92,246,0.12)]"
          />
        </div>
      </div>

      {/* RIGHT: Login Form */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center px-4 py-4 sm:px-6 lg:w-[460px] lg:min-w-[460px] lg:py-0">
        {/* Mobile illustration */}
        <div className="mb-3 w-[clamp(120px,35vw,180px)] sm:mb-4 lg:hidden" style={{ animation: "float 6s ease-in-out infinite" }}>
          <Image src="/login-illustration.svg" alt="CallFlow CRM" width={180} height={150} className="h-auto w-full opacity-70" />
        </div>

        {/* Brand */}
        <div className="mb-3 flex flex-col items-center gap-1 text-center sm:mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-sm font-bold tracking-tight text-white sm:text-base">{APP_NAME}</h1>
          <p className="text-[10px] text-zinc-500 sm:text-[11px]">Professional Call Center Management</p>
        </div>

        {/* Login card */}
        <div className="w-full max-w-[420px]">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-3 text-center text-[9px] text-zinc-600 sm:mt-4 sm:text-[10px]">
          © 2026 VRSH GOUD SERVICES
        </p>
      </div>

      <style>{`
        @keyframes bulb-breathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
