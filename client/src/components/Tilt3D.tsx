import { useState, useCallback, useRef, ReactNode } from 'react';

interface Tilt3DProps {
  children: ReactNode;
  tiltStrength?: number;
  className?: string;
}

export default function Tilt3D({ children, tiltStrength = 15, className = '' }: Tilt3DProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = event.clientX - centerX;
    const deltaY = event.clientY - centerY;

    const maxDistance = Math.max(rect.width, rect.height) / 2;
    const tiltX = (deltaY / maxDistance) * tiltStrength;
    const tiltY = (deltaX / maxDistance) * -tiltStrength;

    setTilt({ x: Math.max(-tiltStrength, Math.min(tiltStrength, tiltX)), y: Math.max(-tiltStrength, Math.min(tiltStrength, tiltY)) });
  }, [tiltStrength, prefersReducedMotion]);

  const handlePointerLeave = useCallback(() => {
    if (prefersReducedMotion) return;
    setTilt({ x: 0, y: 0 });
  }, [prefersReducedMotion]);

  const transformStyle = prefersReducedMotion 
    ? {} 
    : {
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transformStyle: 'preserve-3d' as const,
        willChange: 'transform',
        transition: 'transform 0.1s ease-out',
      };

  return (
    <div
      ref={containerRef}
      className={`transform-gpu ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={transformStyle}
      data-testid="block-hero-tilt"
    >
      {children}
    </div>
  );
}