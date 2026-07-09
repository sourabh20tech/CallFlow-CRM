import Image from "next/image";
import { APP_NAME } from "@/constants/app";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-[#09090f]">
      {/* Ambient background gradients */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 40% 35% at 30% 50%, rgba(139,92,246,0.04), transparent),
            radial-gradient(ellipse 35% 30% at 70% 50%, rgba(99,102,241,0.03), transparent),
            radial-gradient(ellipse 50% 40% at 50% 0%, rgba(255,255,255,0.02), transparent)
          `,
        }}
        aria-hidden
      />

      {/* ─── Hanging Light Bulb (top center) ─── */}
      <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2" aria-hidden>
        <div className="flex flex-col items-center">
          {/* Cable */}
          <div className="h-[clamp(40px,6vh,70px)] w-[2px] bg-gradient-to-b from-zinc-700 to-zinc-800" />
          {/* Fixture cap */}
          <div className="h-3 w-4 rounded-b-md bg-gradient-to-b from-zinc-600 to-zinc-800" />
          {/* Bulb */}
          <div className="relative">
            <div
              className="h-8 w-6 rounded-b-full bg-gradient-to-b from-white/80 via-white/60 to-white/30 sm:h-9 sm:w-7"
              style={{
                boxShadow: `
                  0 0 15px 6px rgba(255,255,255,0.12),
                  0 0 40px 15px rgba(255,255,255,0.06),
                  0 0 80px 30px rgba(255,255,255,0.03)
                `,
              }}
            />
            {/* Breathing glow */}
            <div
              className="absolute -inset-6 rounded-full sm:-inset-8"
              style={{
                background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
                animation: "bulb-breathe 4s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </div>

      {/* Light cone downward */}
      <div
        className="pointer-events-none absolute left-1/2 top-[clamp(70px,10vh,110px)] z-10 -translate-x-1/2"
        aria-hidden
      >
        <div
          style={{
            width: "min(700px, 90vw)",
            height: "clamp(200px, 40vh, 400px)",
            background: "radial-gradient(ellipse 45% 55% at 50% 0%, rgba(255,255,255,0.035) 0%, transparent 70%)",
            animation: "bulb-breathe 4s ease-in-out infinite",
          }}
        />
      </div>

      {/* ─── LEFT: Illustration (desktop/tablet) ─── */}
      <div className="relative hidden flex-1 items-center justify-center lg:flex">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "420px",
            height: "420px",
            background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)",
          }}
          aria-hidden
        />
        <div
          className="relative z-10 w-[clamp(320px,55vw,600px)] px-8"
          style={{ animation: "float 6s ease-in-out infinite" }}
        >
          <Image
            src="/login-illustration.svg"
            alt="CallFlow CRM - Enterprise Call Center Management"
            width={600}
            height={500}
            priority
            className="h-auto w-full drop-shadow-[0_0_40px_rgba(139,92,246,0.15)]"
          />
        </div>
      </div>

      {/* ─── RIGHT: Login Card ─── */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center px-4 sm:px-6 lg:w-[480px] lg:min-w-[480px] xl:w-[520px]">
        {/* Separator line (desktop) */}
        <div className="absolute inset-y-0 left-0 hidden w-px bg-gradient-to-b from-transparent via-violet-500/15 to-transparent lg:block" aria-hidden />

        {/* Mobile: small illustration above card */}
        <div className="mb-4 w-[clamp(160px,50vw,220px)] lg:hidden" style={{ animation: "float 6s ease-in-out infinite" }}>
          <Image
            src="/login-illustration.svg"
            alt="CallFlow CRM"
            width={220}
            height={183}
            className="h-auto w-full opacity-75"
          />
        </div>

        {/* Brand */}
        <div className="mb-4 flex flex-col items-center gap-1.5 text-center sm:mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">{APP_NAME}</h1>
          <p className="text-[11px] text-zinc-500">Professional Call Center Management</p>
        </div>

        {/* Login card container */}
        <div className="w-full max-w-[440px]">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-[10px] text-zinc-600 sm:mt-5">
          © 2026 VRSH GOUD SERVICES
        </p>
      </div>

      {/* ─── Animations ─── */}
      <style>{`
        @keyframes bulb-breathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.65; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
