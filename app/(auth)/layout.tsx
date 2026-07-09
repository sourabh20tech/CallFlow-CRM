import Image from "next/image";
import { APP_NAME } from "@/constants/app";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="login-page">
      {/* Ambient background */}
      <div className="login-bg" aria-hidden />

      {/* Hanging Bulb - always centered */}
      <div className="login-bulb" aria-hidden>
        <div className="login-bulb-cable" />
        <div className="login-bulb-cap" />
        <div className="login-bulb-glass">
          <div className="login-bulb-glow" />
        </div>
      </div>

      {/* DESKTOP/LAPTOP: Two columns */}
      {/* TABLET/MOBILE: Single column stacked */}

      {/* Left: Illustration (hidden on mobile/tablet, shown lg+) */}
      <div className="login-illustration-panel">
        <div className="login-illustration-glow" />
        <div className="login-illustration-wrapper">
          <Image
            src="/login-illustration.svg"
            alt="CallFlow CRM - Enterprise Call Center Management"
            width={520}
            height={433}
            priority
            className="login-illustration-img"
          />
        </div>
      </div>

      {/* Right: Login content */}
      <div className="login-form-panel">
        {/* Mobile/Tablet illustration */}
        <div className="login-mobile-illustration">
          <Image
            src="/login-illustration.svg"
            alt="CallFlow CRM"
            width={200}
            height={167}
            className="login-mobile-illustration-img"
          />
        </div>

        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="login-brand-title">{APP_NAME}</h1>
          <p className="login-brand-subtitle">Professional Call Center Management</p>
        </div>

        {/* Login card */}
        <div className="login-card-container">
          {children}
        </div>

        <p className="login-footer">© 2026 VRSH GOUD SERVICES</p>
      </div>

      <style>{`
        /* ─── Login Page Layout ─── */
        .login-page {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100dvh;
          overflow: hidden;
          background: #09090f;
        }

        .login-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse 40% 35% at 30% 50%, rgba(139,92,246,0.04), transparent),
            radial-gradient(ellipse 35% 30% at 70% 50%, rgba(99,102,241,0.03), transparent);
        }

        /* ─── Bulb ─── */
        .login-bulb {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 30;
          pointer-events: none;
        }
        .login-bulb-cable {
          width: 2px;
          height: 3.5vh;
          background: linear-gradient(to bottom, #52525b, #3f3f46);
        }
        .login-bulb-cap {
          width: 14px;
          height: 10px;
          border-radius: 0 0 4px 4px;
          background: linear-gradient(to bottom, #52525b, #3f3f46);
        }
        .login-bulb-glass {
          position: relative;
          width: 18px;
          height: 24px;
          border-radius: 0 0 50% 50%;
          background: linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.3));
          box-shadow: 0 0 10px 4px rgba(255,255,255,0.1), 0 0 30px 10px rgba(255,255,255,0.05);
        }
        .login-bulb-glow {
          position: absolute;
          inset: -20px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%);
          animation: bulbBreathe 4s ease-in-out infinite;
        }

        /* ─── Illustration Panel (Desktop) ─── */
        .login-illustration-panel {
          display: none;
        }
        .login-illustration-glow {
          position: absolute;
          width: 300px;
          height: 300px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%);
        }
        .login-illustration-wrapper {
          position: relative;
          z-index: 1;
          animation: floatAnim 6s ease-in-out infinite;
        }
        .login-illustration-img {
          width: 100%;
          height: auto;
          filter: drop-shadow(0 0 25px rgba(139,92,246,0.1));
        }

        /* ─── Form Panel ─── */
        .login-form-panel {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 92%;
          max-width: 420px;
          padding: 0.5rem 0;
        }

        /* ─── Mobile Illustration ─── */
        .login-mobile-illustration {
          width: clamp(100px, 28vw, 160px);
          margin-bottom: 0.5rem;
          animation: floatAnim 6s ease-in-out infinite;
        }
        .login-mobile-illustration-img {
          width: 100%;
          height: auto;
          opacity: 0.7;
        }

        /* ─── Brand ─── */
        .login-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
          text-align: center;
        }
        .login-brand-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
        }
        .login-brand-icon svg {
          width: 16px;
          height: 16px;
          color: #a78bfa;
        }
        .login-brand-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: white;
          letter-spacing: -0.01em;
        }
        .login-brand-subtitle {
          font-size: 10px;
          color: #71717a;
        }

        /* ─── Card Container ─── */
        .login-card-container {
          width: 100%;
        }

        /* ─── Footer ─── */
        .login-footer {
          margin-top: 0.5rem;
          font-size: 9px;
          color: #3f3f46;
          text-align: center;
        }

        /* ─── Animations ─── */
        @keyframes bulbBreathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @keyframes floatAnim {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        /* ═══ TABLET (768px+) ═══ */
        @media (min-width: 768px) {
          .login-form-panel {
            max-width: 440px;
            padding: 1rem 0;
          }
          .login-mobile-illustration {
            width: clamp(140px, 22vw, 200px);
            margin-bottom: 0.75rem;
          }
          .login-brand-title { font-size: 1rem; }
          .login-brand-subtitle { font-size: 11px; }
          .login-brand-icon { width: 36px; height: 36px; }
          .login-brand-icon svg { width: 18px; height: 18px; }
          .login-brand { margin-bottom: 0.75rem; gap: 0.35rem; }
          .login-footer { margin-top: 0.75rem; font-size: 10px; }
          .login-bulb-cable { height: 4vh; }
        }

        /* ═══ DESKTOP (1024px+) ═══ */
        @media (min-width: 1024px) {
          .login-page {
            flex-direction: row;
          }
          .login-illustration-panel {
            display: flex;
            position: relative;
            flex: 1;
            align-items: center;
            justify-content: center;
            height: 100%;
          }
          .login-illustration-wrapper {
            width: clamp(280px, 38vw, 460px);
            padding: 2rem;
          }
          .login-mobile-illustration {
            display: none;
          }
          .login-form-panel {
            width: 45%;
            min-width: 400px;
            max-width: 480px;
            padding: 1.5rem 2rem;
          }
          .login-brand-title { font-size: 1.125rem; }
          .login-brand-icon { width: 40px; height: 40px; }
          .login-brand-icon svg { width: 20px; height: 20px; }
          .login-brand { margin-bottom: 1rem; gap: 0.4rem; }
          .login-footer { margin-top: 1rem; font-size: 10px; }
          .login-bulb-cable { height: 5vh; }
        }

        /* ═══ LARGE DESKTOP (1280px+) ═══ */
        @media (min-width: 1280px) {
          .login-illustration-wrapper {
            width: clamp(350px, 42vw, 540px);
          }
          .login-form-panel {
            width: 42%;
            max-width: 500px;
          }
        }

        /* ═══ SMALL MOBILE (≤375px) ═══ */
        @media (max-width: 375px) {
          .login-mobile-illustration {
            width: 90px;
            margin-bottom: 0.35rem;
          }
          .login-brand-title { font-size: 0.8rem; }
          .login-brand-icon { width: 28px; height: 28px; }
          .login-brand-icon svg { width: 14px; height: 14px; }
          .login-brand { margin-bottom: 0.35rem; }
          .login-form-panel { width: 94%; padding: 0.25rem 0; }
          .login-footer { margin-top: 0.35rem; }
          .login-bulb-cable { height: 2.5vh; }
          .login-bulb-glass { width: 14px; height: 18px; }
        }
      `}</style>
    </div>
  );
}
