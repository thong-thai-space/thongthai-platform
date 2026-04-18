'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  getMotionPreference,
  resolveMotionEnabled,
  type MotionPreference,
} from '@/lib/motion-settings';

function CustomCursor({ motionEnabled }: { motionEnabled: boolean }) {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion || !motionEnabled) {
      setEnabled(false);
      return;
    }

    const mediaQuery = window.matchMedia('(pointer: fine)');
    const handleChange = () => setEnabled(mediaQuery.matches);
    handleChange();

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [prefersReducedMotion, motionEnabled]);

  useEffect(() => {
    if (!enabled || !dotRef.current || !ringRef.current) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let rafId = 0;

    const onMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;

      if (!dotRef.current) return;
      dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate3d(-50%, -50%, 0)`;
    };

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.2;
      ringY += (mouseY - ringY) * 0.2;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate3d(-50%, -50%, 0)`;
      }

      rafId = window.requestAnimationFrame(animateRing);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafId = window.requestAnimationFrame(animateRing);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.cancelAnimationFrame(rafId);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={ringRef} className="tts-cursor-ring" />
      <div ref={dotRef} className="tts-cursor-dot" />
    </>
  );
}

export function AnimationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [motionPreference, setMotionPreference] = useState<MotionPreference>('system');
  const [direction, setDirection] = useState<1 | -1>(1);
  const [lowEndMode, setLowEndMode] = useState(false);
  const lastHistoryIdxRef = useRef<number>(0);

  const motionEnabled = resolveMotionEnabled(motionPreference, prefersReducedMotion);
  const highFidelityMotion = motionEnabled && !lowEndMode;

  useEffect(() => {
    const syncPreference = () => {
      setMotionPreference(getMotionPreference());
    };

    syncPreference();
    window.addEventListener('storage', syncPreference);
    window.addEventListener('tts-motion-preference-change', syncPreference);

    return () => {
      window.removeEventListener('storage', syncPreference);
      window.removeEventListener('tts-motion-preference-change', syncPreference);
    };
  }, []);

  useEffect(() => {
    lastHistoryIdxRef.current = Number(window.history.state?.idx ?? 0);

    const handlePopState = (event: PopStateEvent) => {
      const nextIdx = Number(event.state?.idx ?? 0);
      setDirection(nextIdx < lastHistoryIdxRef.current ? -1 : 1);
      lastHistoryIdxRef.current = nextIdx;
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const currentIdx = Number(window.history.state?.idx ?? 0);
    if (currentIdx > lastHistoryIdxRef.current) {
      setDirection(1);
    }
    lastHistoryIdxRef.current = currentIdx;
  }, [pathname]);

  useEffect(() => {
    if (!motionEnabled) {
      setLowEndMode(false);
      return;
    }

    let frameCount = 0;
    let totalDelta = 0;
    let lastTime = performance.now();
    let rafId = 0;

    const sample = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      if (delta > 0 && delta < 100) {
        totalDelta += delta;
        frameCount += 1;
      }

      if (frameCount >= 90) {
        const avgDelta = totalDelta / frameCount;
        const fps = 1000 / avgDelta;
        setLowEndMode(fps < 42);
        frameCount = 0;
        totalDelta = 0;
      }

      rafId = window.requestAnimationFrame(sample);
    };

    rafId = window.requestAnimationFrame(sample);
    return () => window.cancelAnimationFrame(rafId);
  }, [motionEnabled]);

  useEffect(() => {
    document.documentElement.dataset.ttsLowEndMotion = lowEndMode ? '1' : '0';
    return () => {
      delete document.documentElement.dataset.ttsLowEndMotion;
    };
  }, [lowEndMode]);

  useEffect(() => {
    if (!highFidelityMotion) return;

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });

    let rafId = 0;

    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };

    rafId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [highFidelityMotion]);

  return (
    <>
      <CustomCursor motionEnabled={highFidelityMotion} />

      {motionEnabled && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`sweep-${pathname}`}
            className="tts-page-sweep"
            initial={{
              scaleY: 1,
              transformOrigin: direction === 1 ? 'bottom' : 'top',
            }}
            animate={{
              scaleY: 0,
              transformOrigin: direction === 1 ? 'top' : 'bottom',
            }}
            transition={{ duration: highFidelityMotion ? 0.62 : 0.3, ease: [0.76, 0, 0.24, 1] }}
          />
        </AnimatePresence>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          className="tts-route-shell"
          initial={
            motionEnabled
              ? {
                  opacity: 0,
                  x: direction * (highFidelityMotion ? 22 : 12),
                  y: 8,
                  filter: highFidelityMotion ? 'blur(5px)' : 'blur(0px)',
                }
              : false
          }
          animate={motionEnabled ? { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' } : { opacity: 1 }}
          exit={
            motionEnabled
              ? {
                  opacity: 0,
                  x: direction * -(highFidelityMotion ? 20 : 10),
                  y: -4,
                  filter: highFidelityMotion ? 'blur(4px)' : 'blur(0px)',
                }
              : { opacity: 1 }
          }
          transition={{ duration: motionEnabled ? (highFidelityMotion ? 0.42 : 0.22) : 0, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
