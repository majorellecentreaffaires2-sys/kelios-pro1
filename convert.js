import fs from 'fs';

try {
    let content = fs.readFileSync('src/components/landing.tsx', 'utf8');

    // Replace class with className
    content = content.replace(/class=/g, 'className=');
    content = content.replace(/for=/g, 'htmlFor=');

    // Fix self-closing tags
    const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr', 'path', 'circle', 'rect'];
    for (const tag of voidElements) {
        const r = new RegExp('<' + tag + '([^>]*?)(?<!/)>', 'gi');
        content = content.replace(r, '<' + tag + '$1 />');
    }
    content = content.replace(/<br>/gi, '<br />');

    // Special styles fix
    content = content.replace(/style="; mask-image: (.*?); -webkit-mask-image: (.*?)"/g, 'style={{ maskImage: \'$1\', WebkitMaskImage: \'$2\' }}');
    content = content.replace(/style="animation-delay: (.*?);"/g, 'style={{ animationDelay: \'$1\' }}');

    // Remove html, head, body tags
    content = content.replace(/<!DOCTYPE html>|<html[^>]*>|<\/html>|<head>[\s\S]*?<\/head>|<body[^>]*>|<\/body>/gi, '');

    // Extract script logic out of JSX return
    content = content.replace(/<script>([\s\S]*?)<\/script>/gi, '');

    content = content.replace(/<!--[\s\S]*?-->/g, ''); // clear html comments

    // Create final React component
    const finalComponent = `import React, { useEffect } from 'react';

const Landing: React.FC<{onNavigateToLogin: () => void, onNavigateToRegister: () => void}> = ({ onNavigateToLogin, onNavigateToRegister }) => {
  useEffect(() => {
    // Add missing scripts cleanly
    if (!document.querySelector('script[src="https://code.iconify.design/3/3.1.0/iconify.min.js"]')) {
      const s = document.createElement('script');
      s.src = 'https://code.iconify.design/3/3.1.0/iconify.min.js';
      document.head.appendChild(s);
    }

    if (!(window as any).UnicornStudio) {
      (window as any).UnicornStudio = { isInitialized: false };
      const i = document.createElement('script');
      i.src = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js';
      i.onload = () => {
        if (!(window as any).UnicornStudio.isInitialized) {
          (window as any).UnicornStudio.init();
          (window as any).UnicornStudio.isInitialized = true;
        }
      };
      document.head.appendChild(i);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('reveal-hidden');
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const targets = document.querySelectorAll('h1, h2, h3, p, button, .reveal-hidden');
    targets.forEach((el) => {
      if (!el.closest('.animate-marquee-infinite')) {
        el.classList.add('reveal-hidden');
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="antialiased selection:bg-red-600/30 selection:text-white overflow-x-hidden w-full min-h-screen relative font-inter bg-[#050505] text-[#e5e5e5]">
      <style>{\`
        body { font-family: 'Inter', sans-serif; background-color: #050505; color: #e5e5e5; }
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .text-huge { font-size: clamp(3rem, 11vw, 20rem); }
        @keyframes beam-drop { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(500%); opacity: 0; } }
        .animate-beam { animation: beam-drop 4s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        @keyframes border-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-border-spin { animation: border-spin 3s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee-infinite { animation: marquee 40s linear infinite; }
        .animate-marquee-infinite:hover { animation-play-state: paused; }
        @keyframes fadeInUpBlur { 0% { opacity: 0; transform: translateY(20px); filter: blur(10px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0); } }
        .animate-in { animation: fadeInUpBlur 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .reveal-hidden { opacity: 0; }
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); }
        .glass-section { background: rgba(10, 10, 10, 0.65); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      \`}</style>
      ${content}
    </div>
  );
};

export default Landing;
`;

    fs.writeFileSync('src/components/LandingComponent.tsx', finalComponent);
    console.log('Successfully created LandingComponent.tsx');

} catch (err) {
    console.error(err);
}
