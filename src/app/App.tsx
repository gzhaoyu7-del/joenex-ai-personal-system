import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Atmosphere } from '../features/orbit/Atmosphere'
import { KnowledgeOrbit } from '../features/orbit/KnowledgeOrbit'
import { CreatorFrame } from '../features/creator/CreatorFrame'
import { DrawControl } from '../features/draw/DrawControl'
import { CreatorToolbar } from '../components/CreatorToolbar'
import { FieldIndex } from '../components/FieldIndex'
import { Header } from '../components/Header'
import { Intro } from '../components/Intro'
import { Telemetry } from '../components/Telemetry'
import { HomeActions } from '../components/HomeActions'
import { WorkbenchOverlay } from '../features/workbench/WorkbenchOverlay'
import { GestureController } from '../features/gesture/GestureController'
import { useExperienceStore } from '../stores/experienceStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useUIStore } from '../stores/uiStore'

function App() {
  const creatorMode = useExperienceStore((state) => state.creatorMode)
  const drawPhase = useExperienceStore((state) => state.drawPhase)
  const selectedCard = useExperienceStore((state) => state.selectedCard)
  const requestDraw = useExperienceStore((state) => state.requestDraw)
  const gestureStatus = useSettingsStore((state) => state.gestureStatus)
  const gestureMessage = useSettingsStore((state) => state.gestureMessage)
  const workbenchView = useUIStore((state) => state.workbenchView)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !workbenchView && !['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName)) {
        event.preventDefault()
        requestDraw()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [requestDraw, workbenchView])

  return (
    <main className={`app-shell ${creatorMode ? 'is-creator' : ''} phase-${drawPhase}`}>
      <Atmosphere />
      <div className="ambient-glow" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <Header />
      <CreatorToolbar />
      <CreatorFrame />
      <AnimatePresence>{!creatorMode && <FieldIndex />}</AnimatePresence>
      <Intro />
      <KnowledgeOrbit />
      <DrawControl />
      <HomeActions />
      {!creatorMode && <Telemetry />}
      <div className={`gesture-status gesture-status--${gestureStatus}`}>
        <span /> {gestureMessage}
      </div>
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            className="selected-actions"
            style={{ x: '-50%' }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ delay: 0.36, duration: 0.4 }}
          >
            <button type="button" disabled aria-disabled="true" title="Challenge mode is part of Phase 2">
              START CHALLENGE <span>PHASE 02 →</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="edge-index edge-index--left">DRAW · RESEARCH · THINK · EXPLAIN</div>
      <div className="edge-index edge-index--right">KNOWLEDGE ENGINE / FIELD 01</div>
      <GestureController />
      <WorkbenchOverlay />
    </main>
  )
}

export default App
