import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, type Points } from 'three'

function DustField() {
  const points = useRef<Points>(null)
  const nodes = useRef<Points>(null)
  const dust = useMemo(() => {
    const positions = new Float32Array(300 * 3)
    const colors = new Float32Array(300 * 3)
    const archive = new Color('#635a4c')
    const gold = new Color('#c6a15b')
    for (let index = 0; index < 300; index += 1) {
      const angle = Math.random() * Math.PI * 2
      const radius = 1.2 + Math.pow(Math.random(), 0.72) * 7.4
      positions[index * 3] = Math.cos(angle) * radius * 1.28 + (Math.random() - 0.5) * 0.5
      positions[index * 3 + 1] = Math.sin(angle) * radius * 0.54 + (Math.random() - 0.5) * 0.42
      positions[index * 3 + 2] = (Math.random() - 0.5) * 5
      const color = archive.clone().lerp(gold, Math.random() > 0.9 ? 0.72 : Math.random() * 0.18)
      colors.set(color.toArray(), index * 3)
    }
    return { positions, colors }
  }, [])
  const orbitNodes = useMemo(() => {
    const positions = new Float32Array(26 * 3)
    for (let index = 0; index < 26; index += 1) {
      const angle = Math.random() * Math.PI * 2
      const radius = 2.8 + Math.random() * 3.8
      positions[index * 3] = Math.cos(angle) * radius * 1.34
      positions[index * 3 + 1] = Math.sin(angle) * radius * 0.5
      positions[index * 3 + 2] = (Math.random() - 0.5) * 2.8
    }
    return positions
  }, [])

  useFrame(({ pointer }, delta) => {
    if (!points.current) return
    points.current.rotation.z += delta * 0.0018
    points.current.rotation.y += delta * 0.003
    points.current.position.x += (pointer.x * 0.055 - points.current.position.x) * Math.min(1, delta * 1.2)
    points.current.position.y += (pointer.y * 0.035 - points.current.position.y) * Math.min(1, delta * 1.2)
    if (nodes.current) {
      nodes.current.rotation.z -= delta * 0.0045
      nodes.current.position.x += (pointer.x * 0.085 - nodes.current.position.x) * Math.min(1, delta)
      nodes.current.position.y += (pointer.y * 0.05 - nodes.current.position.y) * Math.min(1, delta)
    }
  })

  return (
    <>
      <points ref={points} position={[0, 0, -2]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[dust.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial vertexColors size={0.012} transparent opacity={0.38} sizeAttenuation depthWrite={false} />
      </points>
      <points ref={nodes} position={[0, 0, -1.4]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[orbitNodes, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#c6a15b" size={0.024} transparent opacity={0.48} sizeAttenuation depthWrite={false} />
      </points>
    </>
  )
}

export function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 5], fov: 60 }}>
        <DustField />
      </Canvas>
    </div>
  )
}
