'use client';

import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { useRef, useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import * as THREE from 'three';

// Extend Three.js Line to avoid SVG line conflict
extend({ ThreeLine: THREE.Line });

declare module '@react-three/fiber' {
  interface ThreeElements {
    threeLine: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      ref?: React.Ref<THREE.Line>;
      geometry?: THREE.BufferGeometry;
      children?: React.ReactNode;
    };
  }
}

// Subtle floating particles
function MinimalParticles({ count = 20 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 30;
      pos[i3 + 1] = (Math.random() - 0.5) * 15;
      pos[i3 + 2] = (Math.random() - 0.5) * 15 - 5;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.004;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#6366f1" transparent opacity={0.2} sizeAttenuation />
    </points>
  );
}

// Large Gold XRP Coin with visible logo
function GoldXRPCoin({ position, velocity, delay, onFaded }: {
  position: [number, number, number];
  velocity: [number, number, number];
  delay: number;
  onFaded: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const startTimeRef = useRef(0);
  const posRef = useRef(new THREE.Vector3(...position));
  const velRef = useRef(new THREE.Vector3(...velocity));
  const hasCalledFade = useRef(false);
  const opacityRef = useRef(1);
  const rotSpeedX = useRef(0.02 + Math.random() * 0.03);
  const rotSpeedY = useRef(0.03 + Math.random() * 0.04);

  useFrame((state) => {
    if (startTimeRef.current === 0) {
      startTimeRef.current = state.clock.elapsedTime;
    }

    const elapsed = state.clock.elapsedTime - startTimeRef.current;

    if (elapsed < delay) {
      if (groupRef.current) {
        groupRef.current.visible = false;
      }
      return;
    }

    const activeTime = elapsed - delay;

    if (groupRef.current) {
      groupRef.current.visible = true;

      // Slower physics for better visibility
      velRef.current.y -= 0.004; // Much slower gravity
      velRef.current.multiplyScalar(0.995); // Less drag

      posRef.current.add(velRef.current.clone().multiplyScalar(0.016 * 60));

      // Stop at ground level
      if (posRef.current.y < -3.8) {
        posRef.current.y = -3.8;
        velRef.current.y = 0;
        velRef.current.x *= 0.9;
        velRef.current.z *= 0.9;
        rotSpeedX.current *= 0.95;
        rotSpeedY.current *= 0.95;
      }

      groupRef.current.position.copy(posRef.current);
      groupRef.current.rotation.x += rotSpeedX.current;
      groupRef.current.rotation.y += rotSpeedY.current;

      // Longer fade time
      const fadeStart = 5;
      const fadeDuration = 3;

      if (activeTime > fadeStart) {
        const fadeProgress = Math.min((activeTime - fadeStart) / fadeDuration, 1);
        opacityRef.current = 1 - fadeProgress;

        groupRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              (mesh.material as THREE.MeshStandardMaterial).opacity = opacityRef.current;
            }
          }
        });

        if (fadeProgress >= 1 && !hasCalledFade.current) {
          hasCalledFade.current = true;
          onFaded();
        }
      }
    }
  });

  const coinSize = 0.22; // Bigger coins

  return (
    <group ref={groupRef} position={position}>
      {/* Gold coin base - bigger */}
      <mesh>
        <cylinderGeometry args={[coinSize, coinSize, 0.03, 48]} />
        <meshStandardMaterial
          color="#FFD700"
          metalness={0.95}
          roughness={0.1}
          transparent
          opacity={1}
          emissive="#B8860B"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Coin rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[coinSize, 0.015, 8, 48]} />
        <meshStandardMaterial
          color="#DAA520"
          metalness={0.98}
          roughness={0.08}
          transparent
          opacity={1}
        />
      </mesh>

      {/* XRP Logo - front - larger and more visible */}
      <group position={[0, 0.016, 0]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Top left arm */}
        <mesh position={[-0.055, 0.055, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.11, 0.025, 0.003]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.6} transparent opacity={1} />
        </mesh>
        {/* Top right arm */}
        <mesh position={[0.055, 0.055, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.11, 0.025, 0.003]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.6} transparent opacity={1} />
        </mesh>
        {/* Bottom left arm */}
        <mesh position={[-0.055, -0.055, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.11, 0.025, 0.003]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.6} transparent opacity={1} />
        </mesh>
        {/* Bottom right arm */}
        <mesh position={[0.055, -0.055, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.11, 0.025, 0.003]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.6} transparent opacity={1} />
        </mesh>
        {/* Center dot */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.003, 16]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.6} transparent opacity={1} />
        </mesh>
      </group>

      {/* XRP Logo - back */}
      <group position={[0, -0.016, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh position={[-0.055, 0.055, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.11, 0.025, 0.003]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.6} transparent opacity={1} />
        </mesh>
        <mesh position={[0.055, 0.055, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.11, 0.025, 0.003]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.6} transparent opacity={1} />
        </mesh>
        <mesh position={[-0.055, -0.055, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.11, 0.025, 0.003]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.6} transparent opacity={1} />
        </mesh>
        <mesh position={[0.055, -0.055, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.11, 0.025, 0.003]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.6} transparent opacity={1} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.003, 16]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.6} transparent opacity={1} />
        </mesh>
      </group>
    </group>
  );
}

// Explosion manager with many more coins
function CoinExplosion({ orbPosition, onComplete }: {
  orbPosition: [number, number, number];
  onComplete: () => void;
}) {
  const [fadedCount, setFadedCount] = useState(0);
  const coinCount = 120; // Many more coins

  const coinData = useMemo(() => {
    return Array.from({ length: coinCount }, (_, i) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.8; // More horizontal spread
      const speed = 0.08 + Math.random() * 0.15; // Slower initial speed

      return {
        id: i,
        position: [...orbPosition] as [number, number, number],
        velocity: [
          Math.sin(phi) * Math.cos(theta) * speed * 1.5, // More horizontal
          Math.cos(phi) * speed * 0.5 + 0.05, // Less vertical
          Math.sin(phi) * Math.sin(theta) * speed * 1.5,
        ] as [number, number, number],
        delay: Math.random() * 0.4,
      };
    });
  }, [orbPosition]);

  const handleFaded = useCallback(() => {
    setFadedCount(prev => {
      const newCount = prev + 1;
      if (newCount >= coinCount) {
        setTimeout(onComplete, 100);
      }
      return newCount;
    });
  }, [onComplete]);

  return (
    <group>
      {coinData.map(coin => (
        <GoldXRPCoin
          key={coin.id}
          position={coin.position}
          velocity={coin.velocity}
          delay={coin.delay}
          onFaded={handleFaded}
        />
      ))}
    </group>
  );
}

// Electric swirl tendril around orb
function ElectricTendril({ index, chargeRatio, time }: {
  index: number;
  chargeRatio: number;
  time: number;
}) {
  const lineRef = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 30;
    const baseRadius = 0.6;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 3 + index * (Math.PI * 2 / 5);
      const radius = baseRadius + Math.sin(t * Math.PI * 4) * 0.15;
      const y = (t - 0.5) * 1.2;

      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      ));
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [index]);

  useFrame(() => {
    if (lineRef.current && lineRef.current.geometry) {
      const positions = lineRef.current.geometry.attributes.position;
      const segments = positions.count;

      for (let i = 0; i < segments; i++) {
        const t = i / (segments - 1);
        const angle = t * Math.PI * 3 + index * (Math.PI * 2 / 5) + time * (1 + chargeRatio * 2);
        const radius = 0.6 + Math.sin(t * Math.PI * 4 + time * 3) * 0.15 * chargeRatio;
        const y = (t - 0.5) * 1.2;

        positions.setXYZ(
          i,
          Math.cos(angle) * radius,
          y + Math.sin(time * 5 + t * Math.PI * 2) * 0.05 * chargeRatio,
          Math.sin(angle) * radius
        );
      }

      positions.needsUpdate = true;
      (lineRef.current.material as THREE.LineBasicMaterial).opacity = chargeRatio * 0.8;
    }
  });

  if (chargeRatio < 0.1) return null;

  return (
    <threeLine ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color="#22d3ee" transparent opacity={0} linewidth={2} />
    </threeLine>
  );
}

// Swirling electric orb
function ElectricOrb({ chargeRatio, time }: { chargeRatio: number; time: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = time * (0.2 + chargeRatio * 0.8);
    }

    if (coreRef.current) {
      const pulse = Math.sin(time * (3 + chargeRatio * 5)) * 0.1 * chargeRatio;
      coreRef.current.scale.setScalar(1 + pulse);

      const color = new THREE.Color();
      if (chargeRatio < 0.3) {
        color.setHex(0x1a1a2e);
      } else if (chargeRatio < 0.6) {
        color.lerpColors(new THREE.Color(0x1a1a2e), new THREE.Color(0x0ea5e9), (chargeRatio - 0.3) / 0.3);
      } else if (chargeRatio < 0.85) {
        color.lerpColors(new THREE.Color(0x0ea5e9), new THREE.Color(0x22d3ee), (chargeRatio - 0.6) / 0.25);
      } else {
        color.lerpColors(new THREE.Color(0x22d3ee), new THREE.Color(0xffffff), (chargeRatio - 0.85) / 0.15);
      }

      (coreRef.current.material as THREE.MeshBasicMaterial).color = color;
      (coreRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + chargeRatio * 0.7;
    }

    if (glowRef.current) {
      const pulse = Math.sin(time * 4) * 0.05 * chargeRatio;
      glowRef.current.scale.setScalar(1.3 + pulse + chargeRatio * 0.3);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = chargeRatio * 0.4;
    }

    if (outerGlowRef.current) {
      outerGlowRef.current.scale.setScalar(2 + chargeRatio * 0.5);
      (outerGlowRef.current.material as THREE.MeshBasicMaterial).opacity = chargeRatio * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshBasicMaterial color="#1a1a2e" transparent opacity={0.3} />
      </mesh>

      <mesh ref={glowRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0} />
      </mesh>

      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0} />
      </mesh>

      {[0, 1, 2, 3, 4].map(i => (
        <ElectricTendril key={i} index={i} chargeRatio={chargeRatio} time={time} />
      ))}

      {chargeRatio > 0.3 && (
        <SparkParticles chargeRatio={chargeRatio} time={time} />
      )}
    </group>
  );
}

// Spark particles around orb
function SparkParticles({ chargeRatio, time }: { chargeRatio: number; time: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 40;

  const positions = useMemo(() => new Float32Array(count * 3), []);

  useFrame(() => {
    if (pointsRef.current) {
      const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const angle = (i / count) * Math.PI * 2 + time * 2;
        const radius = 0.7 + Math.sin(time * 10 + i) * 0.2 * chargeRatio;
        const y = Math.sin(time * 3 + i * 0.5) * 0.5;

        posArray[i3] = Math.cos(angle) * radius;
        posArray[i3 + 1] = y;
        posArray[i3 + 2] = Math.sin(angle) * radius;
      }

      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      (pointsRef.current.material as THREE.PointsMaterial).opacity = chargeRatio * 0.8;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#22d3ee" transparent opacity={0} sizeAttenuation />
    </points>
  );
}

// Ground charge point - small mound with grid distortion
function GroundChargePoint({ x, z, buildupProgress, isDischarging }: {
  x: number;
  z: number;
  buildupProgress: number;
  isDischarging: boolean;
}) {
  const moundRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const gridLinesRef = useRef<THREE.Group>(null);
  const popRef = useRef(0);
  const wasDischarging = useRef(false);

  useFrame(() => {
    // Detect discharge moment for pop effect
    if (isDischarging && !wasDischarging.current) {
      popRef.current = 1;
    }
    wasDischarging.current = isDischarging;

    // Pop decay
    popRef.current *= 0.85;

    const popEffect = popRef.current * 0.3;
    const baseHeight = isDischarging ? 0.02 : buildupProgress * 0.35;
    const height = Math.max(0, baseHeight - popEffect);

    if (moundRef.current) {
      // Smaller mound
      moundRef.current.scale.set(
        0.4 + buildupProgress * 0.2,
        height,
        0.4 + buildupProgress * 0.2
      );

      const mat = moundRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = buildupProgress * 0.6;
      mat.opacity = 0.4 + buildupProgress * 0.4;
    }

    // Animate grid lines rising with the mound
    if (gridLinesRef.current) {
      gridLinesRef.current.children.forEach((child, i) => {
        const line = child as THREE.Mesh;
        const dist = (i < 4) ? 0.3 : 0.6; // Inner vs outer lines
        const falloff = (i < 4) ? 1 : 0.5;
        const lineHeight = height * falloff;
        line.position.y = lineHeight * 0.5;
        line.scale.y = 1 + lineHeight * 2;
        (line.material as THREE.MeshBasicMaterial).opacity = buildupProgress * 0.6 * falloff;
      });
    }

    if (glowRef.current) {
      const opacity = isDischarging ? 0.4 : buildupProgress * 0.2;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
      glowRef.current.scale.setScalar(0.5 + buildupProgress * 0.3);
    }
  });

  return (
    <group position={[x, -4, z]}>
      {/* Small mound */}
      <mesh ref={moundRef}>
        <sphereGeometry args={[0.5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#0a1828"
          emissive="#0ea5e9"
          emissiveIntensity={0}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Grid lines that rise with mound */}
      <group ref={gridLinesRef}>
        {/* Inner cross - 4 lines */}
        {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((angle, i) => (
          <mesh key={`inner-${i}`} position={[Math.cos(angle) * 0.3, 0, Math.sin(angle) * 0.3]} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.02, 0.01, 0.4]} />
            <meshBasicMaterial color="#0ea5e9" transparent opacity={0} />
          </mesh>
        ))}
        {/* Outer lines - 4 lines */}
        {[Math.PI/4, Math.PI*3/4, Math.PI*5/4, Math.PI*7/4].map((angle, i) => (
          <mesh key={`outer-${i}`} position={[Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6]} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.02, 0.01, 0.3]} />
            <meshBasicMaterial color="#0ea5e9" transparent opacity={0} />
          </mesh>
        ))}
      </group>

      {/* Subtle glow */}
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.6, 16]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0} />
      </mesh>
    </group>
  );
}

// Electric node with enhanced ground interaction
function ElectricNode({ id, onComplete, onHit, disabled, onProgress }: {
  id: number;
  onComplete: (id: number) => void;
  onHit: () => void;
  disabled: boolean;
  onProgress: (id: number, x: number, z: number, progress: number, isDischarging: boolean) => void;
}) {
  const arcRef = useRef<THREE.Line>(null);
  const startTimeRef = useRef(0);
  const hasHitRef = useRef(false);
  const phaseRef = useRef<'buildup' | 'discharge' | 'fade'>('buildup');

  const startPos = useMemo(() => ({
    x: (Math.random() - 0.5) * 16,
    z: (Math.random() - 0.5) * 10 - 2
  }), []);

  const targetPos = { x: 0, y: 0, z: -6 };

  const buildupDuration = useMemo(() => 2 + Math.random() * 2, []);
  const dischargeDuration = 0.25;
  const fadeDuration = 0.4;

  const arcGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 16;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = startPos.x * (1 - t) + targetPos.x * t;
      const y = -4 * (1 - t) + targetPos.y * t;
      const z = startPos.z * (1 - t) + targetPos.z * t;

      const jitter = i === 0 || i === segments ? 0 : 1;
      const intensity = Math.sin(t * Math.PI) * 0.8;
      const jitterX = (Math.random() - 0.5) * 1 * jitter * intensity;
      const jitterY = (Math.random() - 0.5) * 0.7 * jitter * intensity;
      const jitterZ = (Math.random() - 0.5) * 1 * jitter * intensity;

      points.push(new THREE.Vector3(x + jitterX, y + jitterY, z + jitterZ));
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [startPos.x, startPos.z]);

  useFrame((state) => {
    if (startTimeRef.current === 0) {
      startTimeRef.current = state.clock.elapsedTime;
    }

    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    const totalDuration = buildupDuration + dischargeDuration + fadeDuration;

    if (elapsed > totalDuration) {
      onProgress(id, startPos.x, startPos.z, 0, false);
      onComplete(id);
      return;
    }

    let buildupProgress = 0;
    let dischargeProgress = 0;
    let fadeProgress = 0;
    let isDischarging = false;

    if (elapsed < buildupDuration) {
      phaseRef.current = 'buildup';
      buildupProgress = elapsed / buildupDuration;
      onProgress(id, startPos.x, startPos.z, buildupProgress, false);
    } else if (elapsed < buildupDuration + dischargeDuration) {
      phaseRef.current = 'discharge';
      dischargeProgress = (elapsed - buildupDuration) / dischargeDuration;
      isDischarging = true;
      onProgress(id, startPos.x, startPos.z, 1, true);

      if (!hasHitRef.current && !disabled) {
        hasHitRef.current = true;
        onHit();
      }
    } else {
      phaseRef.current = 'fade';
      fadeProgress = (elapsed - buildupDuration - dischargeDuration) / fadeDuration;
      onProgress(id, startPos.x, startPos.z, 1 - fadeProgress, false);
    }

    if (arcRef.current) {
      let opacity = 0;

      if (phaseRef.current === 'discharge' && !disabled) {
        const flicker = Math.random() > 0.1 ? 1 : 0.3;
        opacity = Math.sin(dischargeProgress * Math.PI) * 0.9 * flicker;
      } else if (phaseRef.current === 'fade' && !disabled) {
        opacity = 0.4 * (1 - fadeProgress) * (Math.random() > 0.2 ? 1 : 0.2);
      }

      (arcRef.current.material as THREE.LineBasicMaterial).opacity = opacity;
    }
  });

  return (
    <group>
      <threeLine ref={arcRef} geometry={arcGeometry}>
        <lineBasicMaterial color="#22d3ee" transparent opacity={0} linewidth={2} />
      </threeLine>
    </group>
  );
}

// Manager for spawning nodes with ground effects
function ElectricNodesManager({ onHit, disabled, chargeRatio }: {
  onHit: () => void;
  disabled: boolean;
  chargeRatio: number;
}) {
  const [nodes, setNodes] = useState<number[]>([]);
  const [groundPoints, setGroundPoints] = useState<Map<number, { x: number; z: number; progress: number; isDischarging: boolean }>>(new Map());
  const nextIdRef = useRef(0);
  const lastSpawnRef = useRef(0);

  const spawnNode = useCallback(() => {
    const id = nextIdRef.current++;
    setNodes(prev => [...prev, id]);
  }, []);

  const removeNode = useCallback((id: number) => {
    setNodes(prev => prev.filter(nodeId => nodeId !== id));
    setGroundPoints(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const updateProgress = useCallback((id: number, x: number, z: number, progress: number, isDischarging: boolean) => {
    setGroundPoints(prev => {
      const next = new Map(prev);
      if (progress > 0) {
        next.set(id, { x, z, progress, isDischarging });
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  useFrame((state) => {
    if (disabled) return;

    const time = state.clock.elapsedTime;
    const interval = 1.5 + Math.random() * 2;

    if (time - lastSpawnRef.current > interval) {
      const count = Math.random() > 0.5 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        setTimeout(() => spawnNode(), i * 300);
      }
      lastSpawnRef.current = time;
    }
  });

  return (
    <group>
      {/* Ground charge points */}
      {Array.from(groundPoints.entries()).map(([id, point]) => (
        <GroundChargePoint
          key={`ground-${id}`}
          x={point.x}
          z={point.z}
          buildupProgress={point.progress}
          isDischarging={point.isDischarging}
        />
      ))}

      {/* Electric arcs */}
      {nodes.map(id => (
        <ElectricNode
          key={id}
          id={id}
          onComplete={removeNode}
          onHit={onHit}
          disabled={disabled}
          onProgress={updateProgress}
        />
      ))}
    </group>
  );
}

// Center orb with charge system
function CenterOrb() {
  const [charge, setCharge] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [time, setTime] = useState(0);
  const pulseRef = useRef(0);

  const maxCharge = 12;
  const chargeRatio = charge / maxCharge;

  const triggerPulse = useCallback(() => {
    if (isExploding) return;

    pulseRef.current = Math.min(pulseRef.current + 0.3, 1);
    setCharge(prev => {
      const newCharge = prev + 1;
      if (newCharge >= maxCharge) {
        setIsExploding(true);
        setShowExplosion(true);
        return maxCharge;
      }
      return newCharge;
    });
  }, [isExploding]);

  const handleExplosionComplete = useCallback(() => {
    setShowExplosion(false);
    setCharge(0);
    setIsExploding(false);
    pulseRef.current = 0;
  }, []);

  useFrame((state) => {
    setTime(state.clock.elapsedTime);
    pulseRef.current *= 0.94;
  });

  return (
    <>
      <group position={[0, 0, -6]}>
        {!isExploding && (
          <ElectricOrb chargeRatio={chargeRatio} time={time} />
        )}
      </group>

      {showExplosion && (
        <CoinExplosion
          orbPosition={[0, 0, -6]}
          onComplete={handleExplosionComplete}
        />
      )}

      <ElectricNodesManager onHit={triggerPulse} disabled={isExploding} chargeRatio={chargeRatio} />
    </>
  );
}

// Simple grid floor
function InteractiveGrid({ chargeRatio }: { chargeRatio: number }) {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (gridRef.current) {
      // Subtle scroll effect
      gridRef.current.position.z = (time * 0.1) % 1;
    }
  });

  return (
    <group position={[0, -4, 0]}>
      <gridHelper
        ref={gridRef}
        args={[80, 80, '#152535', '#152535']}
      />

      {/* Dark base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshBasicMaterial color="#050508" transparent opacity={0.95} />
      </mesh>
    </group>
  );
}

// Wrapper to pass charge to grid
function SceneContent() {
  const [chargeRatio, setChargeRatio] = useState(0);

  return (
    <>
      <CenterOrbWithCallback onChargeChange={setChargeRatio} />
      <InteractiveGrid chargeRatio={chargeRatio} />
      <MinimalParticles count={20} />
    </>
  );
}

// Modified CenterOrb that reports charge
function CenterOrbWithCallback({ onChargeChange }: { onChargeChange: (ratio: number) => void }) {
  const [charge, setCharge] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [time, setTime] = useState(0);
  const pulseRef = useRef(0);

  const maxCharge = 12;
  const chargeRatio = charge / maxCharge;

  useEffect(() => {
    onChargeChange(chargeRatio);
  }, [chargeRatio, onChargeChange]);

  const triggerPulse = useCallback(() => {
    if (isExploding) return;

    pulseRef.current = Math.min(pulseRef.current + 0.3, 1);
    setCharge(prev => {
      const newCharge = prev + 1;
      if (newCharge >= maxCharge) {
        setIsExploding(true);
        setShowExplosion(true);
        return maxCharge;
      }
      return newCharge;
    });
  }, [isExploding]);

  const handleExplosionComplete = useCallback(() => {
    setShowExplosion(false);
    setCharge(0);
    setIsExploding(false);
    pulseRef.current = 0;
  }, []);

  useFrame((state) => {
    setTime(state.clock.elapsedTime);
    pulseRef.current *= 0.94;
  });

  return (
    <>
      <group position={[0, 0, -6]}>
        {!isExploding && (
          <ElectricOrb chargeRatio={chargeRatio} time={time} />
        )}
      </group>

      {showExplosion && (
        <CoinExplosion
          orbPosition={[0, 0, -6]}
          onComplete={handleExplosionComplete}
        />
      )}

      <ElectricNodesManager onHit={triggerPulse} disabled={isExploding} chargeRatio={chargeRatio} />
    </>
  );
}

// Gentle mouse parallax
function CameraRig() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  useFrame(() => {
    camera.position.x += (mouse.current.x * 0.3 - camera.position.x) * 0.008;
    camera.position.y += (-mouse.current.y * 0.15 + 0.2 - camera.position.y) * 0.008;
    camera.lookAt(0, -0.5, -6);
  });

  return null;
}

function Scene() {
  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-5, 3, -5]} intensity={0.4} color="#0ea5e9" />
      <pointLight position={[0, -2, 0]} intensity={0.3} color="#FFD700" />

      <SceneContent />
    </>
  );
}

export default function Scene3D() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="fixed inset-0 -z-10 bg-[#0a0a0f]" />;
  }

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0.5, 9], fov: 50 }}
        style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #0b0a11 50%, #0a0a0f 100%)' }}
        dpr={[1, 1.5]}
      >
        <fog attach="fog" args={['#0a0a0f', 10, 35]} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
