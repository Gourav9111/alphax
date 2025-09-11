import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float } from '@react-three/drei';

interface FloatingObjectProps {
  position: [number, number, number];
  color: string;
  scale?: number;
}

function FloatingObject({ position, color, scale = 1 }: FloatingObjectProps) {
  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={0.3}>
      <mesh position={position} scale={scale}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      
      {/* Simple floating objects */}
      <FloatingObject position={[-3, 2, -2]} color="#E30613" scale={0.8} />
      <FloatingObject position={[3, -1, -1]} color="#FCD34D" scale={0.6} />
      <FloatingObject position={[0, 3, -3]} color="#10B981" scale={0.7} />
      <FloatingObject position={[-2, -2, -2]} color="#3B82F6" scale={0.5} />
    </>
  );
}

interface HeroScene3DProps {
  className?: string;
}

export default function HeroScene3D({ className = '' }: HeroScene3DProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || !isEnabled) {
    return (
      <div 
        className={`absolute inset-0 ${className}`} 
        data-testid="canvas-hero3d-disabled"
      />
    );
  }

  // Error boundary - fallback to disabled state if Three.js fails
  const handleCanvasError = () => {
    console.log('3D Canvas encountered an error, disabling 3D effects');
    setIsEnabled(false);
  };

  try {
    return (
      <div 
        className={`absolute inset-0 ${className}`}
        data-testid="canvas-hero3d"
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          dpr={[1, 1.5]}
          gl={{ 
            powerPreference: 'low-power',
            antialias: false,
            alpha: true 
          }}
          frameloop="demand"
          style={{ pointerEvents: 'none' }}
          onError={handleCanvasError}
        >
          <Scene />
        </Canvas>
      </div>
    );
  } catch (error) {
    console.error('HeroScene3D error:', error);
    return (
      <div 
        className={`absolute inset-0 ${className}`} 
        data-testid="canvas-hero3d-error"
      />
    );
  }
}