import React, { useEffect, useRef } from 'react';

// ─── LOCAL FONT IMPORTS (install with commands below) ───────────────────────
// npm install @fontsource/inter @fontsource/syne @fontsource/jetbrains-mono

// ─── ALL ICONS INLINED — no external iconify script needed ──────────────────
const IconLayers = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>
  </svg>
);
const IconCommand = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>
  </svg>
);
const IconBox = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7l8.7 5l8.7-5M12 22V12"/>
  </svg>
);
const IconZap = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
  </svg>
);
const IconHexagon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16"/>
  </svg>
);
const IconActivity = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20a14.5 14.5 0 0 0 0-20M2 12h20"/>
  </svg>
);
const IconArrowRight = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14m-7-7l7 7l-7 7"/>
  </svg>
);
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8z"/>
  </svg>
);
const IconQuote = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1a6 6 0 0 0 6-6V5a2 2 0 0 0-2-2zM5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1a6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>
  </svg>
);
const IconShieldCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12l2 2l4-4"/>
  </svg>
);
const IconScale = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18m7-13l3 8a5 5 0 0 1-6 0zV7"/><path d="M3 7h1a17 17 0 0 0 8-2a17 17 0 0 0 8 2h1M5 8l3 8a5 5 0 0 1-6 0zV7m2 14h10"/>
  </svg>
);
const IconLock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

// ─── CANVAS AURORA BACKGROUND (replaces heavy Spline iframe + UnicornStudio) ─
const AuroraBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Subtle animated aurora blobs — GPU-friendly: only radial gradients, no pixel loops
      const blobs = [
        { x: 0.3, y: 0.2, r: 0.55, color: 'rgba(180,20,20,0.07)' },
        { x: 0.75, y: 0.35, r: 0.45, color: 'rgba(200,40,40,0.05)' },
        { x: 0.5, y: 0.8, r: 0.5, color: 'rgba(120,10,10,0.06)' },
      ];

      blobs.forEach((b, i) => {
        const ox = Math.sin(t * 0.0007 + i * 2.1) * 0.04;
        const oy = Math.cos(t * 0.0005 + i * 1.7) * 0.04;
        const cx = (b.x + ox) * width;
        const cy = (b.y + oy) * height;
        const radius = b.r * Math.max(width, height);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        g.addColorStop(0, b.color);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      });

      // Subtle grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.025)';
      ctx.lineWidth = 1;
      const step = 80;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      t += 1;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
      style={{ maskImage: 'linear-gradient(to bottom, black 60%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent)' }}
    />
  );
};

// ─── MARQUEE ITEMS ──────────────────────────────────────────────────────────
const marqueeItems = [
  { Icon: IconLayers, label: 'Factures' },
  { Icon: IconCommand, label: 'Devis' },
  { Icon: IconBox, label: 'Clients' },
  { Icon: IconZap, label: 'Paiements' },
  { Icon: IconHexagon, label: 'Relances' },
  { Icon: IconActivity, label: 'Rapports' },
  { Icon: IconGlobe, label: 'Comptabilité' },
];

const testimonials = [
  { initials: 'JL', name: 'Julien Leroy', role: 'Freelance IT', quote: '"La facturation n\'est plus une corvée. J\'ai divisé par deux le temps passé sur l\'administratif."' },
  { initials: 'MD', name: 'Marie Dubois', role: 'Gérante, Agence Web', quote: '"Kelios Pro a transformé notre gestion commerciale. Les relances automatiques nous sauvent un temps précieux."' },
  { initials: 'TG', name: 'Thomas Girard', role: 'Fondateur, Studio Noir', quote: '"Des tableaux de bord hyper clairs et un suivi des paiements en temps réel. C\'est l\'outil parfait pour notre PME."' },
  { initials: 'SB', name: 'Sophie Bernard', role: 'Consultante RH', quote: '"Onboarding en 5 minutes, interface limpide. Je recommande à tous mes collègues indépendants."' },
];

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
const Landing: React.FC<{
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}> = ({ onNavigateToLogin, onNavigateToRegister }) => {

  // ── SEO + structublue data (no external deps) ──
  useEffect(() => {
    document.title = 'Kelios Pro | Logiciel de Facturation et Devis Simple et Rapide';
    document.documentElement.lang = 'fr';

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.content = content;
    };

    setMeta('description', 'Kelios Pro est la solution ultime pour la facturation intelligente, la gestion commerciale et le suivi client. Créez des devis et factures 2x plus vite.');
    setMeta('keywords', 'facturation, devis, logiciel, PME, freelance, gestion commerciale, comptabilité, relances automatiques');
    setMeta('robots', 'index, follow');
    setMeta('og:title', 'Kelios Pro | Facturation & Devis Intelligents', true);
    setMeta('og:description', 'Simplifiez votre facturation et encaissez 2x plus vite.', true);
    setMeta('og:type', 'website', true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', 'Kelios Pro | Facturation Intelligente');

    // JSON-LD structublue data for rich snippets
    let ld = document.querySelector('#ld-json') as HTMLScriptElement | null;
    if (!ld) { ld = document.createElement('script'); ld.id = 'ld-json'; ld.type = 'application/ld+json'; document.head.appendChild(ld); }
    ld.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Kelios Pro',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', description: 'Essai gratuit disponible' },
      description: 'Logiciel de facturation et devis en ligne pour freelances et PME.',
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '312' },
    });

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = window.location.origin + window.location.pathname;

    // ── Scroll-reveal: pure CSS class toggle, no extra library ──
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="antialiased selection:bg-blue-600/30 selection:text-white overflow-x-hidden w-full min-h-screen relative bg-[#050505] text-[#e5e5e5]" style={{ fontFamily: '"Inter", sans-serif' }}>

      {/* ── Inline critical CSS (no flash of unstyled content) ── */}
      <style>{`
        /* Fonts are loaded via @fontsource npm packages — no external requests */
        .font-syne  { font-family: "Syne", sans-serif; }
        .font-mono  { font-family: "JetBrains Mono", monospace; }

        /* Fluid hero type */
        .text-huge  { font-size: clamp(2.8rem, 10vw, 18rem); }

        /* GPU-only animations (compositor only: transform + opacity) */
        @keyframes beam-drop {
          0%   { transform: translateY(-100%); opacity: 0; }
          40%  { opacity: 1; }
          100% { transform: translateY(600%); opacity: 0; }
        }
        .beam { animation: beam-drop 4.5s cubic-bezier(0.4,0,0.2,1) infinite; will-change: transform, opacity; }

        @keyframes border-spin {
          to { transform: rotate(360deg); }
        }
        .spin-border { animation: border-spin 3s linear infinite; will-change: transform; }

        @keyframes marquee {
          to { transform: translateX(-50%); }
        }
        .marquee-track { animation: marquee 38s linear infinite; will-change: transform; }
        .marquee-track:hover { animation-play-state: paused; }

        /* Reveal animation — triggeblue by IntersectionObserver adding .is-visible */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0);  }
        }
        .reveal           { opacity: 0; }
        .reveal.is-visible { animation: fadeInUp 0.7s cubic-bezier(0.2,0.8,0.2,1) forwards; }

        /* Glass utilities */
        .glass  { background: rgba(255,255,255,0.03); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08); }
        .glass-section { background: rgba(10,10,10,0.70); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }

        /* Scrollbar */
        ::-webkit-scrollbar       { width: 5px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }

        /* Spin for lock icon */
        @keyframes slow-spin { to { transform: rotate(360deg); } }
        .slow-spin { animation: slow-spin 10s linear infinite; }
      `}</style>

      {/* ── BACKGROUND: Canvas aurora (no iframes, no WebGL libs) ── */}
      <AuroraBackground />

      {/* ════════════════════════════════ HEADER ════════════════════════════════ */}
      <header className="relative z-20 w-full grid grid-cols-1 md:grid-cols-4 min-h-screen">

        {/* Col 1 — Brand */}
        <div className="flex flex-col p-6 md:p-8 border-b md:border-b-0 border-r border-white/10 relative justify-between">
          <div className="absolute right-0 top-0 h-full w-px bg-white/5 hidden md:block overflow-hidden">
            <div className="beam absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-transparent via-blue-500 to-transparent opacity-75 shadow-[0_0_12px_rgba(239,68,68,0.4)]" />
          </div>
          <div className="absolute -right-[5px] -top-[5px] text-white/20 text-[10px] hidden md:block z-20">+</div>

          <div className="flex flex-col gap-1">
            <span className="font-mono text-blue-500 text-xs tracking-wider">/// KELIOS PRO</span>
            <span className="text-xs tracking-widest uppercase text-neutral-400 font-medium mt-2">Facturation &amp; Devis</span>
          </div>

          <div className="mt-auto mb-8 max-w-xs">
            <p className="text-sm text-neutral-300 leading-relaxed reveal">
              La solution ultime pour la facturation intelligente et la gestion commerciale. Plus rapide, plus sûr, plus performant.
            </p>
          </div>
        </div>

        {/* Cols 2 & 3 — decorative beams */}
        {[1, 2].map(i => (
          <div key={i} className="hidden md:flex flex-col p-8 border-r border-white/10 relative justify-between">
            <div className="absolute right-0 top-0 h-full w-px bg-white/5 overflow-hidden">
              <div className="beam absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-transparent via-blue-500 to-transparent opacity-75" style={{ animationDelay: `${i * 1.5}s` }} />
            </div>
            <div className="absolute -right-[5px] -top-[5px] text-white/20 text-[10px] z-20">+</div>
          </div>
        ))}

        {/* Col 4 — CTAs */}
        <div className="flex flex-col md:p-8 p-6 relative justify-between">
          <div className="flex justify-end md:justify-start">
            <button
              onClick={onNavigateToLogin}
              className="flex items-center gap-2 text-xs text-white font-medium hover:text-blue-500 transition-colors uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full bg-neutral-900/50 backdrop-blur-sm reveal"
              aria-label="Se connecter"
            >
              Connexion <IconUser />
            </button>
          </div>

          <div className="flex justify-end md:justify-start mt-auto mb-8">
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-px rounded-full bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_300deg,#ef4444_360deg)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 spin-border blur-[0.5px]" />
              <button
                onClick={onNavigateToRegister}
                className="relative bg-neutral-950/80 backdrop-blur-md border border-white/10 text-neutral-300 px-6 py-3 rounded-full flex items-center gap-3 shadow-lg group-hover:text-white group-hover:border-transparent transition-all duration-300 reveal"
                aria-label="Démarrer l'essai gratuit"
              >
                <span className="text-xs font-medium tracking-widest uppercase">Démarrer l'essai</span>
                <span className="group-hover:translate-x-1 transition-transform inline-flex"><IconArrowRight /></span>
              </button>
            </div>
          </div>
        </div>

        {/* Hero type — absolutely centblue, pointer-events-none */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center z-10 pointer-events-none hidden md:block px-4">
          <h1 className="text-huge leading-[0.85] text-white tracking-tighter font-syne font-semibold opacity-90 mix-blend-plus-lighter reveal">
            GÉREZ VOTRE CROISSANCE
          </h1>
        </div>
      </header>

      <main>
        {/* ════════════════════════════ MARQUEE STRIP ════════════════════════════ */}
        <section className="z-20 overflow-hidden glass-section w-full border-t border-white/10 relative" aria-hidden="true">
          <div className="flex overflow-hidden py-12 relative items-center">
            <div className="absolute left-0 inset-y-0 w-32 bg-gradient-to-r from-neutral-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 inset-y-0 w-32 bg-gradient-to-l from-neutral-950 to-transparent z-10 pointer-events-none" />
            {/* Two identical sets → seamless loop */}
            <div className="flex gap-20 marquee-track whitespace-nowrap min-w-full">
              {[0, 1].map(set => (
                <div key={set} className="flex items-center gap-20 shrink-0">
                  {marqueeItems.map(({ Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity duration-300 group">
                      <span className="w-6 h-6 group-hover:text-blue-500 transition-colors"><Icon /></span>
                      <span className="text-lg font-semibold font-syne tracking-tight">{label}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════ FEATURES GRID ════════════════════════════ */}
        <section className="z-20 glass-section w-full border-t border-white/10 relative" aria-labelledby="features-heading">
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">

            {/* Sidebar */}
            <div className="md:col-span-1 flex flex-col min-h-[400px] h-full p-8 justify-between bg-white/[0.01]">
              <div>
                <span className="font-mono text-blue-500 text-xs block mb-4">/// OUTILS INTÉGRÉS</span>
                <h2 id="features-heading" className="text-3xl font-syne tracking-tight text-white mb-4 font-medium reveal">Vos Outils<br />de Gestion</h2>
                <p className="text-neutral-400 text-sm leading-relaxed mb-8 reveal">Simplifiez votre quotidien avec des fonctionnalités pensées pour accélérer votre cycle de vente.</p>
              </div>
              <button className="w-max px-6 py-2 border border-white/10 rounded-full text-xs font-medium uppercase tracking-widest hover:bg-white hover:text-black transition-colors reveal">
                Toutes les fonctionnalités
              </button>
            </div>

            {/* 4-card grid */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 divide-y divide-x divide-white/10">

              {/* Card 1 — Devis & Factures */}
              <article className="group flex flex-col hover:bg-white/[0.05] transition-colors duration-500 p-8 relative">
                <div className="aspect-video overflow-hidden flex items-center justify-center bg-neutral-900/50 w-full border border-white/5 rounded mb-8 relative">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(circle,black_50%,transparent_100%)]" />
                  <svg viewBox="0 0 200 160" className="w-48 h-auto drop-shadow-2xl group-hover:scale-110 transition-transform duration-700 z-10" aria-hidden="true">
                    <g transform="translate(100,100)"><path d="M0,-14 L24,0 L0,14 L-24,0 Z" fill="#e5e5e5" opacity=".9"/><path d="M-24,0 L0,14 V40 L-24,26 Z" fill="#525252"/><path d="M0,14 L24,0 V26 L0,40 Z" fill="#262626"/></g>
                    <g transform="translate(60,80)" className="group-hover:-translate-x-2 transition-transform duration-500"><path d="M0,-14 L24,0 L0,14 L-24,0 Z" fill="#a3a3a3"/><path d="M-24,0 L0,14 V40 L-24,26 Z" fill="#404040"/><path d="M0,14 L24,0 V26 L0,40 Z" fill="#171717"/></g>
                    <g transform="translate(140,80)" className="group-hover:translate-x-2 transition-transform duration-500"><path d="M0,-14 L24,0 L0,14 L-24,0 Z" fill="#ef4444"/><path d="M-24,0 L0,14 V40 L-24,26 Z" fill="#b91c1c"/><path d="M0,14 L24,0 V26 L0,40 Z" fill="#991b1b"/></g>
                  </svg>
                </div>
                <span className="font-mono text-neutral-500 text-xs block mb-3">01</span>
                <h3 className="text-xl text-white font-medium uppercase tracking-wide mb-3 font-syne">Devis &amp; Factures</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">Création instantanée et conversion en un clic.</p>
                <div className="mt-auto pt-6 border-t border-white/5">
                  <a href="#" className="text-xs text-neutral-500 group-hover:text-white transition-colors flex items-center gap-2">
                    En savoir plus <IconArrowRight size={12} />
                  </a>
                </div>
              </article>

              {/* Card 2 — Suivi Client */}
              <article className="group flex flex-col hover:bg-white/[0.05] transition-colors duration-500 p-8 relative">
                <div className="aspect-video overflow-hidden flex items-center justify-center bg-neutral-900/50 w-full border border-white/5 rounded mb-8 relative">
                  <div className="w-3/4 h-3/4 bg-neutral-950 border border-white/10 rounded-lg shadow-2xl flex flex-col overflow-hidden group-hover:-translate-y-2 transition-transform duration-500">
                    <div className="h-6 border-b border-white/5 bg-white/[0.02] flex items-center px-2 gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500/50" /><div className="w-2 h-2 rounded-full bg-white/20" /><div className="w-2 h-2 rounded-full bg-white/20" />
                    </div>
                    <div className="flex-1 p-3 flex gap-3">
                      <div className="w-1/4 bg-white/[0.03] rounded animate-pulse" />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="w-full h-16 bg-white/[0.03] rounded" />
                        <div className="flex gap-2 flex-1"><div className="flex-1 bg-white/[0.03] rounded" /><div className="flex-1 bg-white/[0.03] rounded" /></div>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="font-mono text-neutral-500 text-xs block mb-3">02</span>
                <h3 className="text-xl text-white font-medium uppercase tracking-wide mb-3 font-syne">Suivi Client</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">Un CRM simple pour centraliser les données de vos clients.</p>
                <div className="mt-auto pt-6 border-t border-white/5">
                  <a href="#" className="text-xs text-neutral-500 group-hover:text-white transition-colors flex items-center gap-2">Découvrir le CRM <IconArrowRight size={12} /></a>
                </div>
              </article>

              {/* Card 3 — Automatisation */}
              <article className="group flex flex-col hover:bg-white/[0.05] transition-colors duration-500 p-8 relative">
                <div className="aspect-video overflow-hidden flex items-center justify-center bg-neutral-900/50 w-full border border-white/5 rounded mb-8 relative">
                  <div className="w-5/6 bg-[#09090b] rounded-lg border border-white/10 p-4 font-mono text-[10px] shadow-2xl">
                    <div className="flex flex-col gap-1.5 text-neutral-400">
                      <div><span className="text-blue-500">const </span><span className="text-white">init</span> = <span className="text-blue-500">()</span> =&gt; {'{'}</div>
                      <div className="pl-4"><span className="text-neutral-500">// Initialize core</span></div>
                      <div className="pl-4"><span className="text-orange-400">System</span>.<span className="text-yellow-400">boot</span>({'{'}</div>
                      <div className="pl-8">mode: <span className="text-green-400">'secure'</span>,</div>
                      <div className="pl-8">sync: <span className="text-blue-500">true</span></div>
                      <div className="pl-4">{'}'});</div>
                      <div>{'}'}</div>
                    </div>
                  </div>
                </div>
                <span className="font-mono text-neutral-500 text-xs block mb-3">03</span>
                <h3 className="text-xl text-white font-medium uppercase tracking-wide mb-3 font-syne">Automatisation</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">Relances automatiques et synchronisation bancaire en temps réel.</p>
                <div className="mt-auto pt-6 border-t border-white/5">
                  <a href="#" className="text-xs text-neutral-500 group-hover:text-white transition-colors flex items-center gap-2">Voir les automatisations <IconArrowRight size={12} /></a>
                </div>
              </article>

              {/* Card 4 — Analytique */}
              <article className="group flex flex-col hover:bg-white/[0.05] transition-colors duration-500 p-8 relative">
                <div className="aspect-video overflow-hidden flex items-center justify-center bg-neutral-900/50 w-full border border-white/5 rounded mb-8 relative">
                  <div className="w-3/4 h-1/2 flex items-end justify-between gap-2 px-4 border-b border-white/10 pb-px">
                    <div className="w-full bg-neutral-800 h-[30%] rounded-t-sm group-hover:h-[40%] transition-all duration-700" />
                    <div className="w-full bg-neutral-700 h-[50%] rounded-t-sm group-hover:h-[70%] transition-all duration-700 delay-75" />
                    <div className="w-full bg-blue-900/50 h-[40%] rounded-t-sm group-hover:h-[50%] transition-all duration-700 delay-100" />
                    <div className="w-full bg-blue-600 h-[75%] rounded-t-sm group-hover:h-[85%] transition-all duration-700 delay-150 shadow-[0_0_15px_rgba(220,38,38,0.4)]" />
                  </div>
                </div>
                <span className="font-mono text-neutral-500 text-xs block mb-3">04</span>
                <h3 className="text-xl text-white font-medium uppercase tracking-wide mb-3 font-syne">Analytique</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">Tableaux de bord détaillés pour piloter votre chiffre d'affaires.</p>
                <div className="mt-auto pt-6 border-t border-white/5">
                  <a href="#" className="text-xs text-neutral-500 group-hover:text-white transition-colors flex items-center gap-2">Explorer les rapports <IconArrowRight size={12} /></a>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ════════════════════════════ BIG STATEMENT ════════════════════════════ */}
        <section className="relative z-20 w-full border-t border-white/10 glass-section overflow-hidden" aria-label="Encaissez 2x plus vite">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 w-full">
            <div className="hidden md:block" />
            <div className="md:col-span-3 flex items-center py-24 md:py-32 px-8">
              <h2 className="text-5xl md:text-7xl lg:text-9xl font-syne tracking-tighter text-white leading-none font-medium drop-shadow-lg reveal">
                Encaissez 2x<br />plus vite.
              </h2>
            </div>
          </div>
        </section>

        {/* ════════════════════════════ BENEFITS ════════════════════════════════ */}
        <section className="relative z-20 w-full border-t border-white/10 glass-section" aria-labelledby="benefits-heading">
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="p-8 md:col-span-1 flex flex-col justify-between h-full min-h-[400px] bg-white/[0.01]">
              <div>
                <span className="font-mono text-blue-500 text-xs block mb-4">/// POURQUOI KELIOS</span>
                <h2 id="benefits-heading" className="text-3xl font-syne tracking-tight text-white mb-4 font-medium reveal">Atouts Majeurs</h2>
                <p className="text-neutral-400 text-sm leading-relaxed mb-8 reveal">Une plateforme robuste et sécurisée pour garantir la pérennité de votre activité.</p>
              </div>
              <button className="w-max px-6 py-2 border border-white/10 rounded-full text-xs font-medium uppercase tracking-widest hover:bg-white hover:text-black transition-colors reveal">
                Découvrir les avantages
              </button>
            </div>

            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
              {/* Rapidité */}
              <div className="group p-8 flex flex-col justify-between hover:bg-white/[0.05] transition-colors">
                <div>
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-4 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors"><IconZap /></div>
                  <h3 className="text-white font-medium mb-2 font-syne">Rapidité</h3>
                  <p className="text-neutral-500 text-sm">Éditez et envoyez vos documents en un temps record.</p>
                </div>
                <div className="relative h-24 w-full flex items-end gap-1.5 mt-8">
                  {[40, 60, 80, 50].map((h, i) => (
                    <div key={i} className="w-full bg-blue-900/20 rounded-t-[2px] group-hover:bg-blue-500/80 transition-all duration-500" style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }} />
                  ))}
                </div>
              </div>

              {/* Sécurité */}
              <div className="group p-8 flex flex-col justify-between hover:bg-white/[0.05] transition-colors">
                <div>
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-4 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors"><IconShieldCheck /></div>
                  <h3 className="text-white font-medium mb-2 font-syne">Sécurité</h3>
                  <p className="text-neutral-500 text-sm">Données hébergées en France, conformes aux normes (Factur-X).</p>
                </div>
                <div className="relative w-full h-24 mt-8 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border border-dashed border-neutral-700 slow-spin group-hover:border-blue-500 transition-colors" />
                  <span className="absolute text-neutral-600 group-hover:text-blue-500 transition-colors"><IconLock /></span>
                </div>
              </div>

              {/* Évolutivité */}
              <div className="group p-8 flex flex-col justify-between hover:bg-white/[0.05] transition-colors">
                <div>
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-4 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors"><IconScale /></div>
                  <h3 className="text-white font-medium mb-2 font-syne">Évolutivité</h3>
                  <p className="text-neutral-500 text-sm">Des fonctionnalités qui s'adaptent à votre croissance.</p>
                </div>
                <div className="relative w-full h-24 mt-8 bg-neutral-900/50 border border-white/5 rounded overflow-hidden flex items-end">
                  <svg className="w-full h-full text-blue-500/20" preserveAspectRatio="none" viewBox="0 0 100 50" aria-hidden="true">
                    <path d="M0,50 L20,40 L40,45 L60,20 L80,25 L100,5" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:text-blue-500 transition-colors duration-500" />
                    <path d="M0,50 L20,40 L40,45 L60,20 L80,25 L100,5 V50 H0 Z" fill="currentColor" className="opacity-20 group-hover:opacity-40 transition-opacity" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════ TESTIMONIALS ═════════════════════════════ */}
        <section className="relative z-20 w-full border-t border-white/10 glass-section" aria-labelledby="testimonials-heading">
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="p-8 md:col-span-1 flex flex-col justify-between h-full min-h-[400px] bg-white/[0.01]">
              <div>
                <span className="font-mono text-blue-500 text-xs block mb-4">/// AVIS CLIENTS</span>
                <h2 id="testimonials-heading" className="text-3xl font-syne tracking-tight text-white mb-4 font-medium reveal">Ils Témoignent</h2>
                <p className="text-neutral-400 text-sm leading-relaxed mb-8 reveal">Découvrez comment Kelios Pro accompagne la réussite des indépendants et des PME.</p>
              </div>
              <button className="w-max px-6 py-2 border border-white/10 rounded-full text-xs font-medium uppercase tracking-widest hover:bg-white hover:text-black transition-colors reveal">
                Voir plus de témoignages
              </button>
            </div>

            <div className="md:col-span-3 relative overflow-hidden flex items-center">
              <div className="absolute left-0 inset-y-0 w-32 z-20 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none" />
              <div className="absolute right-0 inset-y-0 w-32 z-20 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none" />

              <div className="flex gap-6 py-16 marquee-track w-max pl-8">
                {/* Double the list for seamless loop */}
                {[...testimonials, ...testimonials].map((t, i) => (
                  <blockquote key={i} className="glass w-[420px] p-8 rounded-2xl flex flex-col justify-between shrink-0 hover:border-white/20 transition-all duration-300 group cursor-default">
                    <span className="text-neutral-500 mb-6 group-hover:text-blue-500 transition-colors block"><IconQuote /></span>
                    <p className="text-xl text-neutral-200 font-light leading-snug mb-8 font-syne">{t.quote}</p>
                    <footer className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-mono text-xs text-white shrink-0" aria-hidden="true">
                        {t.initials}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{t.name}</div>
                        <div className="text-neutral-500 text-xs">{t.role}</div>
                      </div>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ════════════════════════════════ FOOTER ════════════════════════════════ */}
      <footer className="relative z-20 w-full border-t border-white/10 glass-section" role="contentinfo">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="p-8 md:col-span-1 flex flex-col justify-between h-full min-h-[300px] bg-white/[0.01]">
            <div>
              <span className="font-mono text-blue-500 text-xs block mb-4">/// DÉMARRER</span>
              <h2 className="text-3xl font-syne tracking-tight text-white mb-4 font-medium reveal">Passez à l'action</h2>
              <p className="text-neutral-400 text-sm leading-relaxed mb-8 reveal">Rejoignez des milliers de professionnels et simplifiez votre facturation dès aujourd'hui.</p>
            </div>
            <button
              onClick={onNavigateToRegister}
              className="w-max px-6 py-3 bg-blue-600 text-white rounded-full text-xs font-medium uppercase tracking-widest hover:bg-blue-700 transition-colors reveal shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              aria-label="Créer un compte gratuit"
            >
              Créer un compte gratuit
            </button>
          </div>

          <div className="p-8 md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
            <nav aria-label="Produit">
              <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-6">Produit</h3>
              <ul className="space-y-3">
                {['Fonctionnalités', 'Tarifs', 'Mises à jour'].map(l => (
                  <li key={l}><a href="#" className="text-neutral-500 text-sm hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Ressources">
              <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-6">Ressources</h3>
              <ul className="space-y-3">
                {["Centre d'aide", 'Blog', 'Contact'].map(l => (
                  <li key={l}><a href="#" className="text-neutral-500 text-sm hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </nav>
            <div className="col-span-2">
              <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-6">Newsletter</h3>
              <div className="flex flex-col gap-4">
                <label htmlFor="newsletter-email" className="sr-only">Votre adresse email</label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="Entrez votre email"
                  className="w-full bg-transparent border-b border-white/20 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-neutral-700"
                  autoComplete="email"
                />
                <button className="self-start text-xs text-neutral-400 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 reveal">
                  S'inscrire <IconArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-neutral-600 text-[10px] uppercase tracking-wider">© 2025 — KELIOS PRO, GESTION EN TEMPS RÉEL</span>
            <span className="text-neutral-600 text-[10px] uppercase tracking-wider">Pensé pour les professionnels.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;