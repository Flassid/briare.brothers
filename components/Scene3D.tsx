'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Torus, Icosahedron } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// Main crypto sphere with color-shifting
function CryptoSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.15;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.25;

      // Color shift effect
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      const hue = (Math.sin(state.clock.getElapsedTime() * 0.3) + 1) * 0.5;
      material.color.setHSL(0.6 + hue * 0.1, 0.8, 0.5);
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 100, 200]} scale={2.5}>
      <MeshDistortMaterial
        color="#3b82f6"
        attach="material"
        distort={0.6}
        speed={1.5}
        roughness={0.1}
        metalness={0.9}
        emissive="#1e40af"
        emissiveIntensity={0.3}
      />
    </Sphere>
  );
}

// Blockchain ring orbits
function BlockchainRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = state.clock.getElapsedTime() * 0.3;
      ring1Ref.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = state.clock.getElapsedTime() * -0.2;
      ring2Ref.current.rotation.z = state.clock.getElapsedTime() * 0.3;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = state.clock.getElapsedTime() * 0.4;
      ring3Ref.current.rotation.z = state.clock.getElapsedTime() * -0.1;
    }
  });

  return (
    <>
      <Torus ref={ring1Ref} args={[3, 0.05, 16, 100]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} />
      </Torus>
      <Torus ref={ring2Ref} args={[3.5, 0.04, 16, 100]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.5} />
      </Torus>
      <Torus ref={ring3Ref} args={[4, 0.03, 16, 100]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
      </Torus>
    </>
  );
}

// Floating crypto nodes
function CryptoNodes() {
  const nodes = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      position: [
        Math.cos((i / 8) * Math.PI * 2) * 5,
        Math.sin((i / 8) * Math.PI * 2) * 3,
        Math.sin((i / 8) * Math.PI * 4) * 2,
      ] as [number, number, number],
      speed: 0.5 + Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  return (
    <>
      {nodes.map((node, i) => (
        <FloatingNode key={i} position={node.position} speed={node.speed} offset={node.offset} />
      ))}
    </>
  );
}

function FloatingNode({ position, speed, offset }: { position: [number, number, number]; speed: number; offset: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * speed + offset) * 0.5;
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.5;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Icosahedron ref={meshRef} args={[0.2, 0]} position={position}>
      <meshStandardMaterial
        color="#60a5fa"
        emissive="#3b82f6"
        emissiveIntensity={0.8}
        metalness={0.8}
        roughness={0.2}
      />
    </Icosahedron>
  );
}

// Enhanced particles with glow
function EnhancedParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 2000;

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;

      const color = new THREE.Color();
      color.setHSL(0.6 + Math.random() * 0.2, 0.8, 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.03;
      particlesRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.1;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Dynamic lighting
function DynamicLights() {
  const light1Ref = useRef<THREE.PointLight>(null);
  const light2Ref = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (light1Ref.current) {
      light1Ref.current.position.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 5;
      light1Ref.current.position.z = Math.cos(state.clock.getElapsedTime() * 0.5) * 5;
      light1Ref.current.intensity = 1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.3;
    }
    if (light2Ref.current) {
      light2Ref.current.position.x = Math.cos(state.clock.getElapsedTime() * 0.7) * 5;
      light2Ref.current.position.z = Math.sin(state.clock.getElapsedTime() * 0.7) * 5;
      light2Ref.current.intensity = 1 + Math.cos(state.clock.getElapsedTime() * 2) * 0.3;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight ref={light1Ref} position={[5, 0, 0]} intensity={1} color="#3b82f6" distance={10} />
      <pointLight ref={light2Ref} position={[-5, 0, 0]} intensity={1} color="#ec4899" distance={10} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#8b5cf6" distance={10} />
    </>
  );
}

export default function Scene3D() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 8], fov: 75 }}>
        <DynamicLights />
        <CryptoSphere />
        <BlockchainRings />
        <CryptoNodes />
        <EnhancedParticles />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
