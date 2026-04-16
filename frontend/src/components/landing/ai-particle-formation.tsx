"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  size: number;
  speedSeed: number;
  warm: boolean;
};

interface AiParticleFormationProps {
  active: boolean;
  className?: string;
  canvasClassName?: string;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function AiParticleFormation({
  active,
  className,
  canvasClassName,
}: AiParticleFormationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let rafId = 0;
    let startTime = 0;
    let particles: Particle[] = [];

    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const buildParticles = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.3;
      const count = width > 900 ? 240 : width > 640 ? 180 : 120;

      particles = new Array(count).fill(null).map((_, index) => {
        const angle = (index / count) * Math.PI * 2;
        const targetOrbit = radius * (0.72 + Math.random() * 0.36);
        const targetX = centerX + Math.cos(angle) * targetOrbit;
        const targetY = centerY + Math.sin(angle) * targetOrbit * 0.62;

        return {
          x: Math.random() * width,
          y: Math.random() * height,
          startX: Math.random() * width,
          startY: Math.random() * height,
          targetX,
          targetY,
          size: 1 + Math.random() * 1.8,
          speedSeed: Math.random() * 1000,
          warm: Math.random() > 0.72,
        };
      });
    };

    const drawFrame = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const centerX = width / 2;
      const centerY = height / 2;

      const introDuration = reducedMotion ? 1 : 1700;
      const introProgress = Math.min(elapsed / introDuration, 1);
      const eased = easeOutCubic(introProgress);

      context.clearRect(0, 0, width, height);

      const bgGradient = context.createRadialGradient(
        centerX,
        centerY,
        8,
        centerX,
        centerY,
        Math.min(width, height) * 0.6,
      );
      bgGradient.addColorStop(0, "rgba(14, 165, 233, 0.18)");
      bgGradient.addColorStop(0.38, "rgba(251, 191, 36, 0.11)");
      bgGradient.addColorStop(0.55, "rgba(14, 165, 233, 0.07)");
      bgGradient.addColorStop(1, "rgba(14, 165, 233, 0)");
      context.fillStyle = bgGradient;
      context.fillRect(0, 0, width, height);

      for (const particle of particles) {
        const wobble = reducedMotion
          ? 0
          : Math.sin((elapsed + particle.speedSeed) * 0.0024) * 4 * (1 - eased);

        const settleDrift = reducedMotion
          ? 0
          : Math.sin((elapsed + particle.speedSeed) * 0.0013) * 1.5 * eased;

        particle.x =
          particle.startX + (particle.targetX - particle.startX) * eased + wobble + settleDrift;
        particle.y =
          particle.startY + (particle.targetY - particle.startY) * eased + wobble * 0.5 - settleDrift;

        const alpha = 0.22 + eased * 0.66;
        context.fillStyle = particle.warm
          ? `rgba(251, 191, 36, ${alpha * 0.92})`
          : `rgba(125, 211, 252, ${alpha})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }

      const corePulse = reducedMotion
        ? 0.22
        : 0.22 + Math.sin(elapsed * 0.0032) * 0.06;
      const innerCoreSize = 4 + corePulse * 3;
      const outerCoreSize = 8 + corePulse * 5;

      context.beginPath();
      context.arc(centerX, centerY, outerCoreSize, 0, Math.PI * 2);
      context.fillStyle = "rgba(34, 211, 238, 0.82)";
      context.shadowColor = "rgba(34, 211, 238, 0.70)";
      context.shadowBlur = 18;
      context.fill();

      context.beginPath();
      context.arc(centerX, centerY, innerCoreSize, 0, Math.PI * 2);
      context.fillStyle = "rgba(251, 191, 36, 0.92)";
      context.shadowColor = "rgba(251, 191, 36, 0.85)";
      context.shadowBlur = 14;
      context.fill();
      context.shadowBlur = 0;

      const orbitGradient = context.createLinearGradient(
        centerX - width * 0.2,
        centerY,
        centerX + width * 0.2,
        centerY,
      );
      orbitGradient.addColorStop(0, "rgba(56, 189, 248, 0.34)");
      orbitGradient.addColorStop(0.5, "rgba(251, 191, 36, 0.30)");
      orbitGradient.addColorStop(1, "rgba(56, 189, 248, 0.34)");
      context.strokeStyle = orbitGradient;
      context.lineWidth = 1.2;
      context.beginPath();
      context.ellipse(centerX, centerY, width * 0.2, height * 0.18, 0, 0, Math.PI * 2);
      context.stroke();

      rafId = window.requestAnimationFrame(drawFrame);
    };

    const reset = () => {
      startTime = 0;
      setCanvasSize();
      buildParticles();
    };

    reset();
    rafId = window.requestAnimationFrame(drawFrame);

    const handleResize = () => {
      reset();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, [active]);

  return (
    <div className={className} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className={
          canvasClassName ||
          "h-28 w-full rounded-2xl border border-cyan-300/45 bg-white/72 dark:border-cyan-400/15 dark:bg-slate-950/65"
        }
      />
    </div>
  );
}
