'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Bot } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';
import type { AnimationClip, Group, Object3D } from 'three';

const MOBILE_MEDIA_QUERY = '(max-width: 768px)';

const AVATAR_CONFIG = {
  face: {
    modelUrl: '/models/astronaut.glb',
    imageUrl: '/models/astronaut-face.png',
    modelScale: 1.55,
    modelPosition: [0, -1.1, 0] as [number, number, number],
    cameraPosition: [0, 0, 3] as [number, number, number],
    cameraFov: 30,
    mobileModelScale: 1.55,
    mobileModelPosition: [0, -1.1, 0] as [number, number, number],
    mobileCameraPosition: [0, 0, 3] as [number, number, number],
    mobileCameraFov: 30,
    clipCircle: true,
    swayAmplitude: 0.12,
    swaySpeed: 0.35,
    bobAmplitude: 0.05,
    bobSpeed: 1.6,
  },
  fullbody: {
    modelUrl: '/models/animated-astronaut-character-in-space-suit-loop/source/astronaut.glb',
    imageUrl: '/models/astronaut-face.png',
    modelScale: 1.7,
    modelPosition: [0, -2.3, 0] as [number, number, number],
    cameraPosition: [0, 0.2, 4.4] as [number, number, number],
    cameraFov: 26,
    mobileModelScale: 1.6,
    mobileModelPosition: [0, -2.0, 0] as [number, number, number],
    mobileCameraPosition: [0, 0.28, 4.7] as [number, number, number],
    mobileCameraFov: 29,
    clipCircle: false,
    swayAmplitude: 0.08,
    swaySpeed: 0.28,
    bobAmplitude: 0.075,
    bobSpeed: 1.25,
  },
} as const;

type AvatarVariant = keyof typeof AVATAR_CONFIG;

type CachedAvatarModel = {
  scene: Object3D;
  animations: AnimationClip[];
};

let cachedModels: Partial<Record<AvatarVariant, CachedAvatarModel>> = {};
let preloadInFlight: Partial<Record<AvatarVariant, boolean>> = {};

type ChatFaceAvatarProps = {
  size?: number;
  variant?: AvatarVariant;
  className?: string;
};

function supportsWebGL() {
  if (typeof window === 'undefined') return false;
  const canvas = document.createElement('canvas');
  return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
}

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function shouldPreferStaticAvatar() {
  if (typeof window === 'undefined') return false;

  const isMobileViewport = window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  const lowConcurrency = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
  const lowMemory = typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === 'number'
    && ((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 0) <= 4;

  return prefersReducedMotion() || isMobileViewport || lowConcurrency || lowMemory;
}

function preloadModelIdle(variant: AvatarVariant) {
  if (typeof window === 'undefined' || cachedModels[variant] || preloadInFlight[variant]) return;

  const { modelUrl } = AVATAR_CONFIG[variant];

  const loadModel = () => {
    if (cachedModels[variant] || preloadInFlight[variant]) return;

    preloadInFlight[variant] = true;
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        cachedModels[variant] = {
          scene: gltf.scene,
          animations: gltf.animations,
        };
        preloadInFlight[variant] = false;
      },
      undefined,
      () => {
        preloadInFlight[variant] = false;
      },
    );
  };

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => loadModel(), { timeout: 2000 });
  } else {
    window.setTimeout(loadModel, 800);
  }
}

function ModelNode({
  scene,
  spin,
  animations,
  modelScale,
  modelPosition,
  swayAmplitude,
  swaySpeed,
  bobAmplitude,
  bobSpeed,
}: {
  scene: Object3D;
  spin: boolean;
  animations: AnimationClip[];
  modelScale: number;
  modelPosition: [number, number, number];
  swayAmplitude: number;
  swaySpeed: number;
  bobAmplitude: number;
  bobSpeed: number;
}) {
  const groupRef = useRef<Group | null>(null);
  const mixerRef = useRef<AnimationMixer | null>(null);

  useEffect(() => {
    if (animations.length === 0) {
      mixerRef.current = null;
      return;
    }

    const mixer = new AnimationMixer(scene);
    for (const clip of animations) {
      const action = mixer.clipAction(clip, scene);
      action.play();
    }

    mixerRef.current = mixer;

    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
    };
  }, [animations, scene]);

  useFrame((state, delta) => {
    mixerRef.current?.update(delta);

    if (!spin || !groupRef.current) return;

    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = Math.sin(t * swaySpeed) * swayAmplitude;
    groupRef.current.position.y = Math.sin(t * bobSpeed) * bobAmplitude;
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={modelScale} position={modelPosition} />
    </group>
  );
}

export function ChatFaceAvatar({
  size = 22,
  variant = 'face',
  className,
}: ChatFaceAvatarProps) {
  const config = AVATAR_CONFIG[variant];
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MEDIA_QUERY).matches : false,
  );
  const [mode, setMode] = useState<'3d' | 'image' | 'icon'>(() =>
    supportsWebGL() && !shouldPreferStaticAvatar() ? '3d' : 'image',
  );
  const [scene, setScene] = useState<Object3D | null>(null);
  const [animations, setAnimations] = useState<AnimationClip[]>([]);
  const spin = useMemo(() => !prefersReducedMotion(), []);
  const avatarWrapperClassName = [
    'relative inline-flex items-center justify-center',
    config.clipCircle ? 'overflow-hidden rounded-full' : 'overflow-visible',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const modelScale = isMobileViewport
    ? config.mobileModelScale
    : config.modelScale;
  const modelPosition = isMobileViewport
    ? config.mobileModelPosition
    : config.modelPosition;
  const cameraPosition = isMobileViewport
    ? config.mobileCameraPosition
    : config.cameraPosition;
  const cameraFov = isMobileViewport
    ? config.mobileCameraFov
    : config.cameraFov;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = () => setIsMobileViewport(media.matches);

    onChange();
    media.addEventListener('change', onChange);

    return () => {
      media.removeEventListener('change', onChange);
    };
  }, []);

  useEffect(() => {
    preloadModelIdle(variant);
  }, [variant]);

  useEffect(() => {
    if (mode !== '3d') return;

    const cached = cachedModels[variant];
    if (cached) {
      setScene(cached.scene.clone(true));
      setAnimations(cached.animations);
      return;
    }

    const loader = new GLTFLoader();
    let active = true;

    loader.load(
      config.modelUrl,
      (gltf) => {
        if (!active) return;
        cachedModels[variant] = {
          scene: gltf.scene,
          animations: gltf.animations,
        };
        setScene(gltf.scene.clone(true));
        setAnimations(gltf.animations);
      },
      undefined,
      () => {
        if (!active) return;
        setMode('image');
      },
    );

    return () => {
      active = false;
    };
  }, [config.modelUrl, mode, variant]);

  if (mode === '3d') {
    if (!scene) {
      return (
        <span
          className="inline-flex animate-pulse items-center justify-center rounded-full bg-primary-foreground/20"
          style={{ width: size, height: size }}
        />
      );
    }

    return (
      <span className={avatarWrapperClassName} style={{ width: size, height: size }}>
        <Canvas
          dpr={[1, 1.2]}
          camera={{ position: cameraPosition, fov: cameraFov }}
          gl={{ alpha: true, antialias: false }}
        >
          <ambientLight intensity={1.1} />
          <directionalLight position={[2, 3, 2]} intensity={1.2} />
          <directionalLight position={[-2, -1, -2]} intensity={0.65} />
          <ModelNode
            scene={scene}
            spin={spin}
            animations={animations}
            modelScale={modelScale}
            modelPosition={modelPosition}
            swayAmplitude={config.swayAmplitude}
            swaySpeed={config.swaySpeed}
            bobAmplitude={config.bobAmplitude}
            bobSpeed={config.bobSpeed}
          />
        </Canvas>
      </span>
    );
  }

  if (mode === 'image') {
    return (
      <span className={avatarWrapperClassName} style={{ width: size, height: size }}>
        <Image
          src={config.imageUrl}
          alt="AI Chat Face"
          fill
          sizes={`${size}px`}
          className="object-contain"
          onError={() => setMode('icon')}
        />
      </span>
    );
  }

  return <Bot className="h-7 w-7" />;
}
