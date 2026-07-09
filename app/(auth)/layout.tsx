import { APP_NAME } from "@/constants/app";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#0a0a0f] px-4 py-8 sm:px-6 sm:py-12">
      {/* Deep dark ambient gradients */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.06), transparent),
            radial-gradient(ellipse 40% 30% at 50% 100%, rgba(99,102,241,0.04), transparent),
            linear-gradient(180deg, #0a0a0f 0%, #0d0d14 50%, #0a0a0f 100%)
          `,
        }}
        aria-hidden
      />

      {/* Hanging cable */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" aria-hidden>
        <div className="relative flex flex-col items-center">
          {/* Cable */}
          <div
            className="w-[2px] bg-gradient-to-b from-zinc-600 via-zinc-700 to-zinc-800"
            style={{ height: "clamp(60px, 12vh, 120px)" }}
          />
          {/* Bulb fixture (cap) */}
          <div className="h-4 w-5 rounded-b-lg bg-gradient-to-b from-zinc-600 to-zinc-800" />
          {/* Bulb glass */}
          <div className="relative">
            <div
              className="h-10 w-8 rounded-b-full bg-gradient-to-b from-white/90 via-white/70 to-white/40"
              style={{
                boxShadow: `
                  0 0 20px 8px rgba(255,255,255,0.15),
                  0 0 60px 20px rgba(255,255,255,0.08),
                  0 0 100px 40px rgba(255,255,255,0.04)
                `,
              }}
            />
            {/* Breathing glow animation */}
            <div
              className="absolute -inset-4 animate-[bulb-glow_4s_ease-in-out_infinite] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Light cone from bulb */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{ top: "clamp(110px, 16vh, 180px)" }}
        aria-hidden
      >
        <div
          className="animate-[bulb-glow_4s_ease-in-out_infinite]"
          style={{
            width: "min(500px, 90vw)",
            height: "400px",
            background: `radial-gradient(ellipse 50% 60% at 50% 0%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)`,
          }}
        />
      </div>

      {/* Brand header */}
      <div className="relative z-10 mb-8 flex flex-col items-center gap-2 text-center sm:mb-10" style={{ animationDelay: "100ms" }}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{APP_NAME}</h1>
        <p className="text-xs text-zinc-500 sm:text-sm">Professional Call Center Management Platform</p>
      </div>

      {/* Login card area */}
      <div className="relative z-10 w-full max-w-md sm:max-w-lg" style={{ animationDelay: "200ms" }}>
        {children}
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-center text-[11px] text-zinc-600">
        © 2026 VRSH GOUD SERVICES · CallFlow CRM
      </p>

      {/* CSS animation for bulb glow */}
      <style>{`
        @keyframes bulb-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
