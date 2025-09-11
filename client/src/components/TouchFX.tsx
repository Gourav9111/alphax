import { useState, useCallback, useRef, useEffect } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

interface TouchFXProps {
  className?: string;
}

export default function TouchFX({ className = '' }: TouchFXProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(0);

  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const createRipple = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newRipple: Ripple = {
      id: rippleIdRef.current++,
      x,
      y,
      timestamp: Date.now()
    };

    setRipples(prev => {
      // Keep max 6 ripples for performance
      const filtered = prev.filter(ripple => Date.now() - ripple.timestamp < 1000);
      return [...filtered.slice(-5), newRipple];
    });

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 800);
  }, [prefersReducedMotion]);

  // Clean up old ripples on component unmount
  useEffect(() => {
    const cleanup = setInterval(() => {
      setRipples(prev => prev.filter(ripple => Date.now() - ripple.timestamp < 1000));
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  if (prefersReducedMotion) {
    return <div ref={containerRef} className={`absolute inset-0 ${className}`} data-testid="overlay-touchfx-disabled" />;
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      onPointerDown={createRipple}
      style={{ pointerEvents: 'auto' }}
      data-testid="overlay-touchfx"
    >
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute pointer-events-none touch-ripple"
          style={{
            left: ripple.x - 25,
            top: ripple.y - 25,
            width: 50,
            height: 50,
          }}
          data-testid={`ripple-${ripple.id}`}
        />
      ))}
    </div>
  );
}