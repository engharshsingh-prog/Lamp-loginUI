import React, { useMemo } from 'react';

export default function GlowParticles({ isLampOn }) {
  // Generate random particles around the screen with warm golden tones
  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const top = Math.random() * 85 + 5; // 5% - 90%
      const left = Math.random() * 90 + 5; // 5% - 95%
      const size = Math.random() * 5 + 3; // 3px - 8px
      const duration = Math.random() * 5 + 4; // 4s - 9s
      const delay = Math.random() * 4;
      const opacity = Math.random() * 0.7 + 0.3;
      const blur = Math.random() * 2 + 1;

      return {
        id: i,
        top: `${top}%`,
        left: `${left}%`,
        size: `${size}px`,
        duration: `${duration}s`,
        delay: `${delay}s`,
        opacity,
        blur: `${blur}px`,
      };
    });
  }, []);

  return (
    <div
      className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 z-15 ${
        isLampOn ? 'opacity-100' : 'opacity-15'
      }`}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: '#facc15',
            boxShadow: `0 0 12px 3px rgba(250, 204, 21, 0.75), 0 0 24px 6px rgba(245, 158, 11, 0.4)`,
            filter: `blur(${p.blur})`,
            animation: `floatParticle ${p.duration} ease-in-out infinite alternate ${p.delay}`,
            opacity: isLampOn ? p.opacity : p.opacity * 0.2,
            transition: 'opacity 0.8s ease',
          }}
        />
      ))}

      <style>{`
        @keyframes floatParticle {
          0% {
            transform: translate(0px, 0px) scale(0.85);
            opacity: 0.3;
          }
          50% {
            transform: translate(12px, -18px) scale(1.15);
            opacity: 0.95;
          }
          100% {
            transform: translate(-10px, -32px) scale(0.9);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}
