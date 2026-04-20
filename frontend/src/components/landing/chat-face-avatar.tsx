'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Bot } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Group, Object3D } from 'three';

const MODEL_URL = '/models/astronaut.glb';
const IMAGE_URL = '/models/astronaut-face.png';
const MOBILE_MEDIA_QUERY = '(max-width: 768px)';

let cachedModelScene: Object3D | null = null;
let preloadInFlight = false;

type ChatFaceAvatarProps = {
  size?: number;
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

function preloadModelIdle() {
  if (typeof window === 'undefined' || cachedModelScene || preloadInFlight) return;

  const loadModel = () => {
    if (cachedModelScene || preloadInFlight) return;

    preloadInFlight = true;
    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        cachedModelScene = gltf.scene;
        preloadInFlight = false;
      },
      undefined,
      () => {
        preloadInFlight = false;
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
}: {
  scene: Object3D;
  spin: boolean;
}) {
  const groupRef = useRef<Group | null>(null);

  useFrame((_, delta) => {
    if (!spin || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.8;
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1.55} position={[0, -1.1, 0]} />
    </group>
  );
}

export function ChatFaceAvatar({ size = 22 }: ChatFaceAvatarProps) {
  const [mode, setMode] = useState<'3d' | 'image' | 'icon'>(() =>
    supportsWebGL() && !shouldPreferStaticAvatar() ? '3d' : 'image',
  );
  const [scene, setScene] = useState<Object3D | null>(null);
  const spin = useMemo(() => !prefersReducedMotion(), []);

  useEffect(() => {
    preloadModelIdle();
  }, []);

  useEffect(() => {
    if (mode !== '3d') return;

    if (cachedModelScene) {
      setScene(cachedModelScene.clone(true));
      return;
    }

    const loader = new GLTFLoader();
    let active = true;

    loader.load(
      MODEL_URL,
      (gltf) => {
        if (!active) return;
        cachedModelScene = gltf.scene;
        setScene(gltf.scene.clone(true));
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
  }, [mode]);

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
      <span
        className="relative inline-flex items-center justify-center overflow-hidden rounded-full"
        style={{ width: size, height: size }}
      >
        <Canvas
          dpr={[1, 1.2]}
          camera={{ position: [0, 0, 3], fov: 30 }}
          gl={{ alpha: true, antialias: false }}
        >
          <ambientLight intensity={1.1} />
          <directionalLight position={[2, 3, 2]} intensity={1.2} />
          <directionalLight position={[-2, -1, -2]} intensity={0.65} />
          <ModelNode scene={scene} spin={spin} />
        </Canvas>
      </span>
    );
  }

  if (mode === 'image') {
    return (
      <span
        className="relative inline-flex items-center justify-center overflow-hidden rounded-full"
        style={{ width: size, height: size }}
      >
        <Image
          src={IMAGE_URL}
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
