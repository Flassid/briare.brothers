"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface SpriteFrame {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl: string;
}

interface AnimationDef {
  name: string;
  frames: string[];
  frameRate: number;
  loop: boolean;
}

interface SpriteSheet {
  frames: SpriteFrame[];
  animations: AnimationDef[];
  frameWidth: number;
  frameHeight: number;
}

interface AnimatedCharacterProps {
  spriteSheet?: SpriteSheet | null;
  fallbackEmoji?: string;
  currentAnimation?: string;
  size?: number;
  className?: string;
  onAnimationEnd?: (animationName: string) => void;
}

export function AnimatedCharacter({
  spriteSheet,
  fallbackEmoji = "⚔️",
  currentAnimation = "idle",
  size = 128,
  className = "",
  onAnimationEnd
}: AnimatedCharacterProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [activeAnimation, setActiveAnimation] = useState<AnimationDef | null>(null);
  const animationRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  
  // Get the current animation definition
  useEffect(() => {
    if (!spriteSheet) return;
    
    const anim = spriteSheet.animations.find(a => a.name === currentAnimation);
    if (anim) {
      setActiveAnimation(anim);
      setCurrentFrame(0);
    }
  }, [spriteSheet, currentAnimation]);

  // Animation loop
  useEffect(() => {
    if (!activeAnimation || !spriteSheet) return;
    
    const frameInterval = 1000 / activeAnimation.frameRate;
    
    const animate = (timestamp: number) => {
      if (timestamp - lastFrameTime.current >= frameInterval) {
        lastFrameTime.current = timestamp;
        
        setCurrentFrame(prev => {
          const nextFrame = prev + 1;
          if (nextFrame >= activeAnimation.frames.length) {
            if (activeAnimation.loop) {
              return 0;
            } else {
              onAnimationEnd?.(activeAnimation.name);
              return prev; // Stay on last frame
            }
          }
          return nextFrame;
        });
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [activeAnimation, spriteSheet, onAnimationEnd]);

  // Get current frame image
  const getCurrentFrameImage = useCallback(() => {
    if (!spriteSheet || !activeAnimation) return null;
    
    const frameName = activeAnimation.frames[currentFrame];
    if (!frameName) return null;
    
    const frame = spriteSheet.frames.find(f => f.name === frameName);
    return frame?.imageUrl || null;
  }, [spriteSheet, activeAnimation, currentFrame]);

  const frameImage = getCurrentFrameImage();

  // Breathing effect for idle
  const [breathOffset, setBreathOffset] = useState(0);
  useEffect(() => {
    if (currentAnimation !== 'idle') return;
    
    const interval = setInterval(() => {
      setBreathOffset(Math.sin(Date.now() / 600) * 2);
    }, 50);
    return () => clearInterval(interval);
  }, [currentAnimation]);

  if (!spriteSheet || spriteSheet.frames.length === 0) {
    // Fallback to emoji
    return (
      <motion.div
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        animate={{ y: breathOffset }}
      >
        <div 
          className="rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/50"
          style={{ width: size * 0.8, height: size * 0.8 }}
        >
          <span style={{ fontSize: size * 0.4 }}>{fallbackEmoji}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      animate={{ 
        y: currentAnimation === 'idle' ? breathOffset : 0,
        scale: currentAnimation === 'attack' ? [1, 1.1, 1] : 
               currentAnimation === 'special' ? [1, 1.2, 1.1] :
               currentAnimation === 'hurt' ? [1, 0.9, 1] : 1
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Glow effect */}
      <div 
        className={`absolute inset-0 rounded-full blur-xl ${
          currentAnimation === 'special' ? 'bg-purple-500/60' :
          currentAnimation === 'powerup' ? 'bg-yellow-500/60' :
          currentAnimation === 'cast' ? 'bg-blue-500/60' :
          'bg-amber-500/30'
        }`}
        style={{ transform: 'scale(1.2)' }}
      />
      
      {/* Character sprite */}
      {frameImage ? (
        <img
          src={frameImage}
          alt="Character"
          className="relative z-10 w-full h-full object-contain"
          style={{
            imageRendering: 'pixelated',
            filter: currentAnimation === 'hurt' ? 'brightness(1.5) saturate(0.5)' :
                   currentAnimation === 'powerup' ? 'brightness(1.3)' :
                   currentAnimation === 'special' ? 'brightness(1.2) saturate(1.2)' : 'none'
          }}
        />
      ) : (
        <div 
          className="relative z-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center w-full h-full"
        >
          <span style={{ fontSize: size * 0.4 }}>{fallbackEmoji}</span>
        </div>
      )}
      
      {/* Special effects overlay */}
      {currentAnimation === 'special' && (
        <motion.div
          className="absolute inset-0 z-20 pointer-events-none"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          <div className="w-full h-full bg-gradient-radial from-purple-400/50 to-transparent" />
        </motion.div>
      )}
      
      {currentAnimation === 'cast' && (
        <motion.div
          className="absolute -inset-4 z-20 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-full h-full border-2 border-blue-400/30 rounded-full border-dashed" />
        </motion.div>
      )}
    </motion.div>
  );
}
