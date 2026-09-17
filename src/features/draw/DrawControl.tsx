import { ArrowRight } from 'lucide-react'
import { PearlButton } from '../../components/ui/pearl-button'
import { soundManager } from '../../services/SoundManager'
import { selectActiveDeck, useDeckStore } from '../../stores/deckStore'
import { useExperienceStore } from '../../stores/experienceStore'

const phaseLabels = {
  idle: 'READY',
  accelerating: 'ACCELERATING',
  velocity: 'SEARCHING FIELD',
  decelerating: 'NARROWING SIGNAL',
  locking: 'MAGNETIC LOCK',
  revealed: 'CONCEPT FOUND',
} as const

export function DrawControl() {
  const deck = useDeckStore(selectActiveDeck)
  const drawPhase = useExperienceStore((state) => state.drawPhase)
  const selectedCard = useExperienceStore((state) => state.selectedCard)
  const requestDraw = useExperienceStore((state) => state.requestDraw)
  const busy = !['idle', 'revealed'].includes(drawPhase)
  const empty = !deck || deck.cards.length === 0

  const draw = () => {
    void soundManager.unlock()
    requestDraw()
  }

  return (
    <div className="draw-control">
      <div className="draw-status" role="status" aria-live="polite">
        <span className={busy ? 'status-dot is-active' : 'status-dot'} />
        {empty ? 'ADD KNOWLEDGE FIRST' : phaseLabels[drawPhase]}
      </div>
      <PearlButton
        className={`draw-button ${selectedCard ? 'draw-button--again' : ''}`}
        type="button"
        onClick={draw}
        disabled={busy || empty}
        label={selectedCard ? 'DRAW AGAIN' : 'DRAW'}
        endIcon={<ArrowRight size={16} strokeWidth={1.4} />}
        aria-label={selectedCard ? 'Draw another concept' : 'Draw a concept'}
      />
      <p className="draw-hint">CLICK OR PRESS SPACE</p>
    </div>
  )
}
