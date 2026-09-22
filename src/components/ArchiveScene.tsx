import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { SceneVisualState } from '../engine/decayState'

const COOL_GLOW = '#6fd8ff'
const WARM_GLOW = '#f4c978'

function lerpColor(a: string, b: string, t: number) {
  return new THREE.Color(a).lerp(new THREE.Color(b), t)
}

function Pedestal() {
  return (
    <mesh position={[0, -1.3, 0]}>
      <cylinderGeometry args={[1.1, 1.5, 0.6, 8]} />
      <meshStandardMaterial color="#101629" roughness={0.85} metalness={0.15} />
    </mesh>
  )
}

interface GlyphSeed {
  position: THREE.Vector3
  speed: number
  offset: number
}

function GlyphCluster({ visual }: { visual: SceneVisualState }) {
  const groupRef = useRef<THREE.Group>(null)

  const glyphs = useMemo<GlyphSeed[]>(() => {
    return Array.from({ length: visual.glyphCount }).map((_, i) => {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / visual.glyphCount)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      const radius = 0.9 + ((i * 37) % 10) / 25
      return {
        position: new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi) * 0.6 + 0.4,
          radius * Math.sin(phi) * Math.sin(theta),
        ),
        speed: 0.2 + ((i * 53) % 10) / 20,
        offset: ((i * 71) % 100) / 100 * Math.PI * 2,
      }
    })
  }, [visual.glyphCount])

  const color = useMemo(() => lerpColor(COOL_GLOW, WARM_GLOW, visual.warmBlend), [visual.warmBlend])

  useFrame((state) => {
    const group = groupRef.current
    if (!group) return
    group.rotation.y += 0.0015 * visual.motionSpeed
    const t = state.clock.elapsedTime
    group.children.forEach((child, i) => {
      const seed = glyphs[i]
      if (!seed) return
      child.position.y = seed.position.y + Math.sin(t * seed.speed + seed.offset) * 0.08
      const mesh = child as THREE.Mesh
      const material = mesh.material as THREE.MeshStandardMaterial
      if (material && visual.flicker > 0) {
        const flickerWave = Math.sin(t * 6 + seed.offset) * 0.5 + 0.5
        material.emissiveIntensity = flickerWave < visual.flicker ? 0.3 : 1.4
      }
    })
  })

  return (
    <group ref={groupRef}>
      {glyphs.map((seed, i) => (
        <mesh key={i} position={seed.position}>
          <octahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.2}
            toneMapped={false}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  )
}

/** Deterministic pseudo-random in [0, 1), seeded by index — avoids impure Math.random during render. */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function BackgroundParticles() {
  const positions = useMemo(() => {
    const count = 400
    const array = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      array[i * 3] = (pseudoRandom(i * 3 + 1) - 0.5) * 20
      array[i * 3 + 1] = (pseudoRandom(i * 3 + 2) - 0.5) * 12
      array[i * 3 + 2] = (pseudoRandom(i * 3 + 3) - 0.5) * 20 - 4
    }
    return array
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#8993a8" size={0.02} transparent opacity={0.4} sizeAttenuation />
    </points>
  )
}

interface ArchiveSceneProps {
  visual: SceneVisualState
  /** Set false on low-end/mobile devices to drop bloom and reduce particle load. */
  highFidelity?: boolean
}

export function ArchiveScene({ visual, highFidelity = true }: ArchiveSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.6, 4.2], fov: 45 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={highFidelity ? [1, 1.5] : [1, 1]}
    >
      <color attach="background" args={['#080b16']} />
      <fogExp2 attach="fog" args={['#080b16', visual.fogDensity]} />
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 1, 2]} intensity={0.6} color={COOL_GLOW} />
      <Pedestal />
      <GlyphCluster visual={visual} />
      {highFidelity && <BackgroundParticles />}
      {highFidelity && (
        <EffectComposer>
          <Bloom intensity={visual.bloomIntensity} luminanceThreshold={0.15} luminanceSmoothing={0.4} mipmapBlur />
        </EffectComposer>
      )}
    </Canvas>
  )
}
