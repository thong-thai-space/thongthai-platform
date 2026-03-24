'use client';

import Link from 'next/link';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Sparkles, Stars } from '@react-three/drei';
import { ArrowRight, MousePointerClick } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Group, Mesh } from 'three';
import { create } from 'zustand';
import { useOrbitalItemsWithFallback, type OrbitalItem } from '@/hooks/use-orbital-items';
import { useSectionContent } from '@/hooks/use-content';

type HeroContent = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaSecondaryText?: string;
};

// Fallback CMS content if fetch fails
const DEFAULT_HERO_CONTENT: HeroContent = {
  eyebrow: 'Space Dynamic Hero',
  title: 'Thong Thai Space in Motion',
  subtitle: 'Interactive 3D showcase',
  description: 'Rotate the system, choose a moon, and stream service or project insights in real time.',
  ctaText: 'Get a free quote',
  ctaSecondaryText: 'View portfolio',
};

type HeroStore = {
  selectedItem: OrbitalItem | null;
  selectItem: (item: OrbitalItem) => void;
};

const useHeroStore = create<HeroStore>((set) => ({
  selectedItem: null,
  selectItem: (item) => set({ selectedItem: item }),
}));

function StreamingInfoPanel() {
  const selectedItem = useHeroStore((s) => s.selectedItem);

  return (
    <aside className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/20 bg-slate-950/70 p-5 text-slate-100 shadow-2xl backdrop-blur-md">
      <div className="mb-3 inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-300">
        {selectedItem ? (selectedItem.kind === 'service' ? 'Service' : 'Featured Project') : 'Live Feed'}
      </div>

      {selectedItem ? (
        <>
          <h3 className="text-xl font-semibold leading-tight text-white">{selectedItem.name}</h3>
          <p className="mt-2 text-sm text-slate-300">{selectedItem.short}</p>
          <p className="mt-4 min-h-24 text-sm leading-6 text-slate-200">
            <StreamingText key={selectedItem.id} text={selectedItem.details} />
          </p>

          <Link
            href={selectedItem.href}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400"
          >
            Explore details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </>
      ) : (
        <div className="flex min-h-28 items-center gap-3 text-sm text-slate-300">
          <MousePointerClick className="h-5 w-5 text-sky-300" />
          <p>
            Click any orbiting moon to stream information. Drag on the scene to rotate
            manually, or release to resume auto rotation.
          </p>
        </div>
      )}
    </aside>
  );
}

function StreamingText({ text }: { text: string }) {
  const [streamed, setStreamed] = useState('');

  useEffect(() => {
    let index = 0;

    const timer = window.setInterval(() => {
      index += 1;
      setStreamed(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, 12);

    return () => window.clearInterval(timer);
  }, [text]);

  return <>{streamed}</>;
}

function CorePlanet() {
  const planetRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.2;
      planetRef.current.rotation.x += delta * 0.04;
    }
  });

  return (
    <group>
      <mesh ref={planetRef}>
        <sphereGeometry args={[2.2, 64, 64]} />
        <meshStandardMaterial color="#0EA5E9" emissive="#1D4ED8" emissiveIntensity={0.35} metalness={0.2} roughness={0.45} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.9, 0.04, 20, 160]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.45} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[7.2, 0.02, 16, 220]} />
        <meshBasicMaterial color="#60A5FA" transparent opacity={0.35} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[10.8, 0.02, 16, 260]} />
        <meshBasicMaterial color="#93C5FD" transparent opacity={0.24} />
      </mesh>
    </group>
  );
}

type OrbitingMoonProps = {
  item: OrbitalItem;
  index: number;
  total: number;
};

function OrbitingMoon({ item, index, total }: OrbitingMoonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const selectItem = useHeroStore((s) => s.selectItem);

  const phase = useMemo(() => (index / total) * Math.PI * 2, [index, total]);

  return (
    <group>
      <MoonMotion
        item={item}
        phase={phase}
        isHovered={isHovered}
        onSelect={selectItem}
        onHover={setIsHovered}
      />
    </group>
  );
}

type MoonMotionProps = {
  item: OrbitalItem;
  phase: number;
  isHovered: boolean;
  onSelect: (item: OrbitalItem) => void;
  onHover: (value: boolean) => void;
};

function MoonMotion({ item, phase, isHovered, onSelect, onHover }: MoonMotionProps) {
  const moonRef = useRef<Group>(null);

  useFrame((state) => {
    if (!moonRef.current) return;

    const t = state.clock.elapsedTime;
    const angle = t * item.orbitSpeed + phase;
    const x = Math.cos(angle) * item.orbitRadius;
    const z = Math.sin(angle) * item.orbitRadius;
    const y = Math.sin(t * 1.4 + phase) * 0.35;

    moonRef.current.position.set(x, y, z);
    moonRef.current.rotation.y += 0.02;
  });

  return (
    <group ref={moonRef}>
      <mesh
        scale={isHovered ? 1.18 : 1}
        onPointerEnter={() => onHover(true)}
        onPointerLeave={() => onHover(false)}
        onClick={() => onSelect(item)}
      >
        <sphereGeometry args={[item.size, 32, 32]} />
        <meshStandardMaterial
          color={item.color}
          emissive={item.color}
          emissiveIntensity={isHovered ? 1.05 : 0.62}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>

      {isHovered ? (
        <Html center distanceFactor={14}>
          <div className="rounded-full border border-white/25 bg-slate-900/80 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            {item.name}
          </div>
        </Html>
      ) : null}
    </group>
  );
}

function OrbitalScene({ items }: { items: OrbitalItem[] }) {
  // Optimize rendering based on viewport width
  // Mobile: reduced particle count and effects
  // Desktop: full quality rendering
  // Pattern: Responsive Performance Optimization
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  const starsConfig = {
    count: isMobile ? 800 : 2400,
    factor: isMobile ? 2.0 : 3.2,
  };
  
  const sparklesConfig = {
    count: isMobile ? 30 : 70,
    scale: isMobile ? 14 : 22,
  };
  
  const pointLightIntensity = {
    primary: isMobile ? 25 : 40,
    secondary: isMobile ? 10 : 16,
  };

  return (
    <>
      <color attach="background" args={['#020617']} />
      <fog attach="fog" args={['#020617', 15, 44]} />

      <ambientLight intensity={0.55} />
      <pointLight 
        position={[8, 10, 8]} 
        intensity={pointLightIntensity.primary} 
        color="#7DD3FC" 
      />
      <pointLight 
        position={[-10, -6, -8]} 
        intensity={pointLightIntensity.secondary} 
        color="#FACC15" 
      />

      <Stars 
        radius={100} 
        depth={42} 
        count={starsConfig.count} 
        factor={starsConfig.factor} 
        fade 
        speed={0.5} 
      />
      <Sparkles 
        count={sparklesConfig.count} 
        scale={sparklesConfig.scale} 
        size={2.2} 
        speed={0.28} 
        color="#7DD3FC" 
      />

      <CorePlanet />

      {items.map((item, index) => (
        <OrbitingMoon
          key={item.id}
          item={item}
          index={index}
          total={items.length}
        />
      ))}

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 2.7}
        maxPolarAngle={Math.PI / 1.9}
        autoRotate
        autoRotateSpeed={0.35}
        enableDamping
        dampingFactor={0.07}
      />
    </>
  );
}

export function PlanetHero() {
  // Fetch services from CMS + projects from Portfolio API
  // Falls back to hardcoded data if APIs are unavailable
  const orbitalItems = useOrbitalItemsWithFallback();
  
  // Fetch hero section content from CMS
  // Pattern: Defensive data fetching with fallback
  const { data: heroContentResponse } = useSectionContent('hero');
  const cmsHeroContent = (heroContentResponse?.data || {}) as HeroContent;
  const heroContent: HeroContent = {
    ...DEFAULT_HERO_CONTENT,
    ...cmsHeroContent,
  };
  
  const serviceCount = orbitalItems.filter((item) => item.kind === 'service').length;
  const projectCount = orbitalItems.filter((item) => item.kind === 'project').length;
  
  const stats = [
    { value: orbitalItems.length.toString(), label: 'Orbiting entities' },
    { value: serviceCount.toString(), label: 'Core services' },
    { value: projectCount.toString(), label: 'Featured projects' },
    { value: '24/7', label: 'Dynamic showcase' },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(14,165,233,0.22),transparent_38%),radial-gradient(circle_at_80%_75%,rgba(245,158,11,0.16),transparent_32%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
          <div className="rounded-3xl border border-white/10 bg-slate-900/35 p-4 shadow-[0_0_0_1px_rgba(148,163,184,0.08),0_24px_80px_rgba(2,6,23,0.8)] backdrop-blur-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
                  {heroContent.eyebrow}
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
                  {heroContent.title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                  {heroContent.description}
                </p>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400"
                >
                  {heroContent.ctaText}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/portfolio"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {heroContent.ctaSecondaryText}
                </Link>
              </div>
            </div>

            <div className="h-105 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 sm:h-125">
              <Canvas 
                camera={{ position: [0, 5.5, 16], fov: 50 }}
                dpr={typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : undefined}
              >
                <OrbitalScene items={orbitalItems} />
              </Canvas>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/10 bg-slate-900/65 p-3 text-center"
                >
                  <div className="text-lg font-semibold text-sky-300 sm:text-xl">{stat.value}</div>
                  <div className="mt-1 text-xs text-slate-300 sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pt-8">
            <StreamingInfoPanel />
          </div>
        </div>
      </div>
    </section>
  );
}
