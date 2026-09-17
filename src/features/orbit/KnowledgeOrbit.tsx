import { animate, motion, useReducedMotion, type AnimationPlaybackControls } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { CardGradientSurface } from '../../components/ui/card-gradient-surface'
import { soundManager } from '../../services/SoundManager'
import { selectActiveDeck, useDeckStore } from '../../stores/deckStore'
import { useExperienceStore } from '../../stores/experienceStore'
import type { DrawPhase, KnowledgeCard } from '../../types'

const TAU = Math.PI * 2

function spinProgress(progress: number) {
  // A weighted selector wheel: immediate energy followed by a long, readable
  // mechanical coast. Tick spacing naturally opens up as this curve flattens.
  return 1 - Math.pow(1 - progress, 2.35)
}

function phaseAt(progress: number): DrawPhase {
  if (progress < 0.18) return 'velocity'
  if (progress < 0.92) return 'decelerating'
  return 'locking'
}

function getRelativeAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

interface OrbitCardProps {
  card: KnowledgeCard
  index: number
  deckLength: number
  baseAngle: number
  pointer: { x: number; y: number }
  selectedId?: string
  phase: DrawPhase
  reducedMotion: boolean
  onSelect: (index: number) => void
}

function OrbitCard({ card, index, deckLength, baseAngle, pointer, selectedId, phase, reducedMotion, onSelect }: OrbitCardProps) {
  const separation = TAU / deckLength
  const angle = getRelativeAngle(baseAngle + index * separation)
  const depth = (Math.cos(angle) + 1) / 2
  const isSelected = selectedId === card.id && phase === 'revealed'
  const isSuppressed = phase === 'revealed' && !isSelected
  const orbitWidth = Math.min(window.innerWidth * 0.33, 470)
  const orbitHeight = Math.min(window.innerHeight * 0.19, 150)
  const x = Math.sin(angle) * orbitWidth + pointer.x * (14 + depth * 10)
  const y = Math.sin(angle * 2) * orbitHeight - (depth - 0.45) * 24 + pointer.y * (8 + depth * 7)
  // Render the selected card at its real CSS size. Scaling an entire text card
  // above 1x can leave Chromium compositing a soft intermediate texture.
  const scale = isSelected ? 1 : 0.56 + depth * 0.54
  const opacity = isSuppressed ? 0.055 : 0.23 + depth * 0.77
  const zIndex = isSelected ? 100 : Math.round(depth * 80)

  return (
    <motion.button
      className={`orbit-card ${isSelected ? 'is-selected' : ''}`}
      type="button"
      aria-label={`${card.titleZh}, ${card.titleEn}`}
      style={{ x, y, scale, opacity, zIndex }}
      animate={isSelected ? { y: [y + 8, y - 2, y] } : undefined}
      transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 140, damping: 18 }}
      onClick={() => onSelect(index)}
    >
      <CardGradientSurface active={isSelected} />
      <div className="card-scanline" />
      <header>
        <span>{isSelected ? `ORBIT NODE // ${String(index + 1).padStart(2, '0')}` : String(index + 1).padStart(2, '0')}</span>
        <span>{card.category}</span>
      </header>
      <div className="orbit-card__zh">{card.titleZh || card.titleEn}</div>
      <div className="orbit-card__en">{card.shortEn || card.titleEn}</div>
      {!isSelected && (
        <div className="orbit-card__full-en" style={{ opacity: Math.max(0, (depth - 0.72) * 2.8) }}>
          {card.titleEn}
        </div>
      )}
      {isSelected && (
        <motion.div
          className="orbit-card__reveal"
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.48 }}
        >
          <div className="reveal-rule" />
          {(card.shortEn || '').toLocaleLowerCase() !== card.titleEn.toLocaleLowerCase() && (
            <p className="orbit-card__term">{card.titleEn}</p>
          )}
          <p className="orbit-card__category">{card.category}</p>
          {card.descriptionZh && <p className="orbit-card__description orbit-card__description--zh">{card.descriptionZh}</p>}
          {card.descriptionEn && <p className="orbit-card__description orbit-card__description--en">{card.descriptionEn}</p>}
        </motion.div>
      )}
    </motion.button>
  )
}

export function KnowledgeOrbit() {
  const deck = useDeckStore(selectActiveDeck)
  const drawRunId = useExperienceStore((state) => state.drawRunId)
  const gestureSpinRunId = useExperienceStore((state) => state.gestureSpinRunId)
  const lockRunId = useExperienceStore((state) => state.lockRunId)
  const rotateRunId = useExperienceStore((state) => state.rotateRunId)
  const rotateDirection = useExperienceStore((state) => state.rotateDirection)
  const selectRunId = useExperienceStore((state) => state.selectRunId)
  const drawPhase = useExperienceStore((state) => state.drawPhase)
  const selectedCard = useExperienceStore((state) => state.selectedCard)
  const setDrawPhase = useExperienceStore((state) => state.setDrawPhase)
  const revealCard = useExperienceStore((state) => state.revealCard)
  const clearSelection = useExperienceStore((state) => state.clearSelection)
  const reducedMotion = useReducedMotion() ?? false
  const [baseAngle, setBaseAngle] = useState(0.18)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const angleRef = useRef(baseAngle)
  const controlsRef = useRef<AnimationPlaybackControls | null>(null)
  const lastSelectedIndex = useRef(-1)
  const idleFrame = useRef<number | null>(null)
  const gestureFrame = useRef<number | null>(null)
  const motionToken = useRef(0)
  const handledDrawRunId = useRef(0)
  const handledGestureSpinRunId = useRef(0)
  const handledLockRunId = useRef(0)
  const handledRotateRunId = useRef(0)
  const handledSelectRunId = useRef(0)
  const cards = useMemo(() => deck?.cards ?? [], [deck?.cards])

  const stopGestureSpin = useCallback(() => {
    if (gestureFrame.current !== null) cancelAnimationFrame(gestureFrame.current)
    gestureFrame.current = null
  }, [])

  useEffect(() => {
    angleRef.current = baseAngle
  }, [baseAngle])

  useEffect(() => {
    controlsRef.current?.stop()
    stopGestureSpin()
    angleRef.current = 0.18
    setBaseAngle(0.18)
    clearSelection()
  }, [deck?.id, clearSelection, stopGestureSpin])

  useEffect(() => {
    if (drawPhase !== 'idle' || cards.length === 0) return
    let lastTime = performance.now()
    const drift = (time: number) => {
      const delta = Math.min(time - lastTime, 32)
      lastTime = time
      angleRef.current += delta * 0.000055
      setBaseAngle(angleRef.current)
      idleFrame.current = requestAnimationFrame(drift)
    }
    idleFrame.current = requestAnimationFrame(drift)
    return () => {
      if (idleFrame.current) cancelAnimationFrame(idleFrame.current)
    }
  }, [cards.length, drawPhase])

  const finishReveal = useCallback((card: KnowledgeCard) => {
    soundManager.playSnap()
    window.setTimeout(() => {
      revealCard(card)
      soundManager.playReveal()
    }, reducedMotion ? 40 : 170)
  }, [reducedMotion, revealCard])

  const runMotion = useCallback((
    destination: number,
    duration: number,
    selectedIndex: number | null,
    fullSpin: boolean,
  ) => {
    if (cards.length === 0) return
    stopGestureSpin()
    controlsRef.current?.stop()
    motionToken.current += 1
    const token = motionToken.current
    const start = angleRef.current
    const distance = destination - start
    const separation = TAU / cards.length
    let lastAngle = start
    let lastTime = performance.now()
    let lastThreshold = Math.floor(start / separation)

    controlsRef.current = animate(0, 1, {
      duration,
      ease: fullSpin ? 'linear' : [0.2, 0.82, 0.22, 1],
      onUpdate: (progress) => {
        if (token !== motionToken.current) return
        // DRAW is an explicit, user-requested motion. Keep its full physical
        // timing even when the host browser reports reduced-motion; decorative
        // card/reveal transitions still respect the system preference.
        const mapped = fullSpin ? spinProgress(progress) : progress
        const nextAngle = start + distance * mapped
        const now = performance.now()
        const deltaSeconds = Math.max((now - lastTime) / 1000, 0.001)
        const velocity = Math.abs(nextAngle - lastAngle) / deltaSeconds
        const threshold = Math.floor(nextAngle / separation)
        if (threshold !== lastThreshold) {
          const crossed = Math.min(8, Math.abs(threshold - lastThreshold))
          for (let step = 0; step < crossed; step += 1) {
            if (step === 0) soundManager.playTick(velocity)
            else window.setTimeout(() => soundManager.playTick(velocity), step * 4)
          }
          lastThreshold = threshold
        }
        lastAngle = nextAngle
        lastTime = now
        angleRef.current = nextAngle
        setBaseAngle(nextAngle)
        setDrawPhase(fullSpin ? phaseAt(progress) : 'locking')
      },
      onComplete: () => {
        if (token !== motionToken.current) return
        angleRef.current = destination
        setBaseAngle(destination)
        if (selectedIndex === null) setDrawPhase('idle')
        else finishReveal(cards[selectedIndex])
      },
    })
  }, [cards, finishReveal, setDrawPhase, stopGestureSpin])

  useEffect(() => {
    if (drawRunId === 0 || drawRunId === handledDrawRunId.current) return
    handledDrawRunId.current = drawRunId
    if (cards.length === 0) return
    void soundManager.unlock()
    const available = cards.map((_, index) => index).filter((index) => index !== lastSelectedIndex.current)
    const selectedIndex = available[Math.floor(Math.random() * available.length)]
    lastSelectedIndex.current = selectedIndex
    const separation = TAU / cards.length
    const current = angleRef.current
    const finalNormalized = -selectedIndex * separation
    const turns = 2 + Math.floor(Math.random() * 2)
    let destination = finalNormalized
    while (destination <= current + turns * TAU) destination += TAU
    runMotion(destination, 5.5, selectedIndex, true)
  }, [cards, drawRunId, reducedMotion, runMotion])

  useEffect(() => {
    if (gestureSpinRunId === 0 || gestureSpinRunId === handledGestureSpinRunId.current) return
    handledGestureSpinRunId.current = gestureSpinRunId
    if (cards.length === 0) return
    controlsRef.current?.stop()
    stopGestureSpin()
    clearSelection()
    void soundManager.unlock()
    motionToken.current += 1
    const token = motionToken.current
    const separation = TAU / cards.length
    const direction = Math.random() > 0.5 ? 1 : -1
    const targetVelocity = direction * (8.8 + Math.random() * 3.6)
    let velocity = 0
    let lastTime = performance.now()
    const startedAt = lastTime
    let lastThreshold = Math.floor(angleRef.current / separation)

    const spin = (now: number) => {
      if (token !== motionToken.current) return
      const deltaMs = Math.min(now - lastTime, 34)
      lastTime = now
      const response = 1 - Math.exp(-deltaMs / 230)
      velocity += (targetVelocity - velocity) * response
      const nextAngle = angleRef.current + velocity * (deltaMs / 1000)
      const threshold = Math.floor(nextAngle / separation)
      if (threshold !== lastThreshold) {
        const crossed = Math.min(6, Math.abs(threshold - lastThreshold))
        for (let step = 0; step < crossed; step += 1) {
          if (step === 0) soundManager.playTick(Math.abs(velocity))
          else window.setTimeout(() => soundManager.playTick(Math.abs(velocity)), step * 5)
        }
        lastThreshold = threshold
      }
      angleRef.current = nextAngle
      setBaseAngle(nextAngle)
      setDrawPhase(now - startedAt < 720 ? 'accelerating' : 'velocity')
      gestureFrame.current = requestAnimationFrame(spin)
    }
    gestureFrame.current = requestAnimationFrame(spin)
    return stopGestureSpin
  }, [cards.length, clearSelection, gestureSpinRunId, setDrawPhase, stopGestureSpin])

  const selectIndex = useCallback((index: number) => {
    if (cards.length === 0 || !['idle', 'revealed'].includes(useExperienceStore.getState().drawPhase)) return
    void soundManager.unlock()
    clearSelection()
    const separation = TAU / cards.length
    const currentAngle = currentRelativeCardAngle(index, angleRef.current, separation)
    const destination = angleRef.current - currentAngle
    lastSelectedIndex.current = index
    runMotion(destination, reducedMotion ? 0.18 : 0.72, index, false)
  }, [cards.length, clearSelection, reducedMotion, runMotion])

  useEffect(() => {
    if (lockRunId === 0 || lockRunId === handledLockRunId.current) return
    handledLockRunId.current = lockRunId
    if (cards.length === 0) return
    controlsRef.current?.stop()
    stopGestureSpin()
    motionToken.current += 1
    const separation = TAU / cards.length
    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY
    cards.forEach((_, index) => {
      const distance = Math.abs(currentRelativeCardAngle(index, angleRef.current, separation))
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })
    const destination = angleRef.current - currentRelativeCardAngle(nearestIndex, angleRef.current, separation)
    lastSelectedIndex.current = nearestIndex
    runMotion(destination, reducedMotion ? 0.16 : 0.66, nearestIndex, false)
  }, [cards, lockRunId, reducedMotion, runMotion, stopGestureSpin])

  useEffect(() => () => stopGestureSpin(), [stopGestureSpin])

  useEffect(() => {
    if (rotateRunId === 0 || rotateRunId === handledRotateRunId.current) return
    handledRotateRunId.current = rotateRunId
    if (cards.length === 0) return
    if (!['idle', 'revealed'].includes(useExperienceStore.getState().drawPhase)) return
    clearSelection()
    const separation = TAU / cards.length
    runMotion(angleRef.current + rotateDirection * separation * 1.5, 0.48, null, false)
  }, [cards.length, clearSelection, rotateDirection, rotateRunId, runMotion])

  useEffect(() => {
    if (selectRunId === 0 || selectRunId === handledSelectRunId.current) return
    handledSelectRunId.current = selectRunId
    if (cards.length === 0) return
    const separation = TAU / cards.length
    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY
    cards.forEach((_, index) => {
      const distance = Math.abs(currentRelativeCardAngle(index, angleRef.current, separation))
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })
    selectIndex(nearestIndex)
  }, [cards, selectIndex, selectRunId])

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drawPhase !== 'idle' && drawPhase !== 'revealed') return
    const bounds = event.currentTarget.getBoundingClientRect()
    setPointer({
      x: (event.clientX - bounds.left) / bounds.width - 0.5,
      y: (event.clientY - bounds.top) / bounds.height - 0.5,
    })
  }

  return (
    <section
      className={`knowledge-orbit phase-${drawPhase}`}
      style={{
        '--orbit-parallax-x': `${pointer.x * 5}px`,
        '--orbit-parallax-y': `${pointer.y * 3}px`,
      } as CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setPointer({ x: 0, y: 0 })}
      aria-label={`${deck?.name ?? 'Knowledge'} concepts orbit`}
    >
      <div className="orbit-system" aria-hidden="true">
        <div className="orbit-track orbit-track--alpha"><i className="track-node track-node--a" /><i className="track-node track-node--b" /></div>
        <div className="orbit-track orbit-track--beta"><i className="track-node track-node--c" /></div>
        <div className="orbit-track orbit-track--gamma"><i className="track-node track-node--d" /></div>
        <div className="orbit-reticle"><span /><span /><span /><span /></div>
        <span className="orbit-coordinate orbit-coordinate--nw">K-43.7 / ARC 01</span>
        <span className="orbit-coordinate orbit-coordinate--se">NODE FIELD · LIVE</span>
      </div>
      <div className="orbit-axis orbit-axis--x" />
      <div className="orbit-axis orbit-axis--y" />
      <div className="orbit-core" />
      {!['idle', 'revealed'].includes(drawPhase) && (
        <div className={`orbit-scan orbit-scan--${drawPhase}`} aria-live="polite">
          <span />{drawPhase === 'locking' ? 'KNOWLEDGE FOUND' : 'SEARCHING KNOWLEDGE NETWORK'}<em>{drawPhase === 'locking' ? 'NODE CAPTURED' : 'ARCHIVE INDEX / SCANNING'}</em>
        </div>
      )}
      {cards.length === 0 ? (
        <div className="orbit-empty">
          <span>EMPTY KNOWLEDGE FIELD</span>
          <strong>添加第一条知识，让轨道开始运转。</strong>
        </div>
      ) : (
        <div className="orbit-cards">
          {cards.map((card, index) => (
            <OrbitCard
              key={card.id}
              card={card}
              index={index}
              deckLength={cards.length}
              baseAngle={baseAngle}
              pointer={pointer}
              selectedId={selectedCard?.id}
              phase={drawPhase}
              reducedMotion={reducedMotion}
              onSelect={selectIndex}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function currentRelativeCardAngle(index: number, baseAngle: number, separation: number) {
  return getRelativeAngle(baseAngle + index * separation)
}
