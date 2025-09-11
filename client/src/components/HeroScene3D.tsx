import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingObjectProps {
  position: [number, number, number];
  color: string;
  mousePosition: { x: number; y: number };
}

function FloatingObject({ position, color, mousePosition }: FloatingObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Gentle rotation
    meshRef.current.rotation.x += 0.005;
    meshRef.current.rotation.y += 0.003;

    // Mouse attraction effect
    const attraction = 0.1;
    const mouseX = (mousePosition.x - 0.5) * 2;
    const mouseY = (mousePosition.y - 0.5) * 2;
    
    meshRef.current.position.x = position[0] + mouseX * attraction;
    meshRef.current.position.y = position[1] + mouseY * attraction;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[0.3, 0]} />
        <meshPhysicalMaterial 
          color={color}
          transparent
          opacity={0.7}
          roughness={0.1}
          metalness={0.8}
          clearcoat={1}
        />
      </mesh>
    </Float>
  );
}

function FloatingParticles({ mousePosition }: { mousePosition: { x: number; y: number } }) {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 100; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
        ] as [number, number, number],
        speed: Math.random() * 0.02 + 0.01,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;

    particles.forEach((particle, i) => {
      const matrix = new THREE.Matrix4();
      const time = state.clock.elapsedTime;
      
      // Apply mouse influence
      const mouseInfluence = 0.5;
      const mouseX = (mousePosition.x - 0.5) * mouseInfluence;
      const mouseY = (mousePosition.y - 0.5) * mouseInfluence;
      
      matrix.setPosition(
        particle.position[0] + Math.sin(time + particle.offset) * particle.speed + mouseX,
        particle.position[1] + Math.cos(time + particle.offset) * particle.speed + mouseY,
        particle.position[2] + Math.sin(time * 0.5 + particle.offset) * 0.5
      );
      
      particlesRef.current!.setMatrixAt(i, matrix);
    });
    
    particlesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={particlesRef} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshBasicMaterial color="#E30613" transparent opacity={0.6} />
    </instancedMesh>
  );
}

function Scene({ mousePosition }: { mousePosition: { x: number; y: number } }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4F46E5" />
      
      {/* Floating geometric objects */}
      <FloatingObject position={[-2, 1, -2]} color="#E30613" mousePosition={mousePosition} />
      <FloatingObject position={[2, -1, -1]} color="#FCD34D" mousePosition={mousePosition} />
      <FloatingObject position={[0, 2, -3]} color="#10B981" mousePosition={mousePosition} />
      <FloatingObject position={[-1, -2, -2]} color="#3B82F6" mousePosition={mousePosition} />
      
      {/* Floating particles */}
      <FloatingParticles mousePosition={mousePosition} />
    </>
  );
}

interface HeroScene3DProps {
  className?: string;
}

export default function HeroScene3D({ className = '' }: HeroScene3DProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleMouseMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    });
  };

  if (prefersReducedMotion) {
    return <div className={`absolute inset-0 ${className}`} data-testid="canvas-hero3d-disabled" />;
  }

  return (
    <div 
      className={`absolute inset-0 ${className}`}
      onPointerMove={handleMouseMove}
      data-testid="canvas-hero3d"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        dpr={[1, 1.5]}
        gl={{ 
          powerPreference: 'low-power', 
          antialias: true,
          alpha: true
        }}
        frameloop="always"
        style={{ pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <Scene mousePosition={mousePosition} />
        </Suspense>
      </Canvas>
    </div>
  );
}