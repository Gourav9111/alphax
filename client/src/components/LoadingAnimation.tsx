import { useState, useEffect } from "react";

interface LoadingAnimationProps {
  onComplete: () => void;
}

export default function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'scattered' | 'assembling' | 'complete'>('scattered');

  useEffect(() => {
    // Disable scroll
    document.body.style.overflow = 'hidden';

    const timer1 = setTimeout(() => {
      setAnimationPhase('assembling');
    }, 500);

    const timer2 = setTimeout(() => {
      setAnimationPhase('complete');
    }, 2500);

    const timer3 = setTimeout(() => {
      setIsVisible(false);
      // Re-enable scroll
      document.body.style.overflow = 'unset';
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      document.body.style.overflow = 'unset';
    };
  }, [onComplete]);

  if (!isVisible) return null;

  const letters = ['K', 'A', 'M', 'I', 'O'];

  const getLetterStyle = (index: number) => {
    if (animationPhase === 'scattered') {
      // Scattered positions - letters start from different corners/edges
      const positions = [
        { x: -200, y: -200, rotate: -45 }, // K - top left
        { x: 200, y: -150, rotate: 90 },   // A - top right  
        { x: 0, y: 300, rotate: 180 },     // M - bottom center
        { x: -150, y: 200, rotate: -90 },  // I - bottom left
        { x: 250, y: 150, rotate: 135 }    // O - right
      ];
      
      return {
        transform: `translate(${positions[index].x}px, ${positions[index].y}px) rotate(${positions[index].rotate}deg) scale(0.3)`,
        opacity: 0.7,
        transition: 'none'
      };
    }
    
    if (animationPhase === 'assembling') {
      // Letters move to their final positions
      const spacing = 80; // Space between letters
      const startX = -(letters.length - 1) * spacing / 2; // Center the word
      
      return {
        transform: `translateX(${startX + index * spacing}px) rotate(0deg) scale(1)`,
        opacity: 1,
        transition: 'all 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)' // Bouncy easing
      };
    }

    // Complete phase - final position with glow effect
    const spacing = 80;
    const startX = -(letters.length - 1) * spacing / 2;
    
    return {
      transform: `translateX(${startX + index * spacing}px) rotate(0deg) scale(1.1)`,
      opacity: 1,
      transition: 'all 0.5s ease-out'
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-primary/20 via-white to-primary/10 flex items-center justify-center">
      {/* Background blur overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/80" />
      
      {/* KAMIO Letters */}
      <div className="relative flex items-center justify-center">
        {letters.map((letter, index) => (
          <div
            key={letter}
            className={`
              text-8xl md:text-9xl font-bold text-primary 
              absolute select-none pointer-events-none
              ${animationPhase === 'complete' ? 'drop-shadow-2xl' : ''}
            `}
            style={getLetterStyle(index)}
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Pulse effect background for complete phase */}
      {animationPhase === 'complete' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full animate-ping" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full animate-pulse" />
        </div>
      )}

      {/* Loading dots for the scattered phase */}
      {animationPhase === 'scattered' && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}