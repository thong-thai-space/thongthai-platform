'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { type HTMLAttributes, type ReactNode } from 'react';

interface MotionRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  amount?: number;
}

export function MotionReveal({
  children,
  className,
  delay = 0,
  duration = 0.6,
  distance = 24,
  once = true,
  amount = 0.2,
}: MotionRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: distance, filter: 'blur(4px)' }}
      whileInView={
        prefersReducedMotion
          ? { opacity: 1 }
          : { opacity: 1, y: 0, filter: 'blur(0px)' }
      }
      viewport={{ once, amount }}
      transition={{ duration: prefersReducedMotion ? 0 : duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface MotionCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
}

interface MotionSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function MotionSection({
  children,
  className,
  delay = 0,
}: MotionSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      className={className}
      initial={
        prefersReducedMotion
          ? false
          : { opacity: 0.92, y: 26, scale: 0.988, filter: 'blur(4px)' }
      }
      whileInView={
        prefersReducedMotion
          ? { opacity: 1 }
          : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
      }
      viewport={{ once: false, amount: 0.12 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.72,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.section>
  );
}

export function MotionCard({
  children,
  className,
  delay = 0,
  onMouseMove,
  onMouseLeave,
  ...props
}: MotionCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <MotionReveal
      className={className}
      delay={delay}
      distance={30}
      duration={0.55}
    >
      <div
        {...props}
        className={`tts-motion-card ${className ?? ''}`.trim()}
        onMouseMove={(event) => {
          if (!prefersReducedMotion) {
            const rect = event.currentTarget.getBoundingClientRect();
            const relX = event.clientX - rect.left;
            const relY = event.clientY - rect.top;
            const rotateY = ((relX - rect.width / 2) / rect.width) * 8;
            const rotateX = -((relY - rect.height / 2) / rect.height) * 8;

            event.currentTarget.style.setProperty('--mx', `${(relX / rect.width) * 100}%`);
            event.currentTarget.style.setProperty('--my', `${(relY / rect.height) * 100}%`);
            event.currentTarget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
          }

          onMouseMove?.(event);
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = '';
          onMouseLeave?.(event);
        }}
      >
        {children}
      </div>
    </MotionReveal>
  );
}
