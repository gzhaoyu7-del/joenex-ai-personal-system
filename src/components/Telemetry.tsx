import { selectActiveDeck, useDeckStore } from '../stores/deckStore'
import { useExperienceStore } from '../stores/experienceStore'

export function Telemetry() {
  const deck = useDeckStore(selectActiveDeck)
  const drawPhase = useExperienceStore((state) => state.drawPhase)
  const selectedCard = useExperienceStore((state) => state.selectedCard)
  return (
    <div className="telemetry" aria-hidden="true">
      <div><span>DECK</span><strong>{deck?.name ?? '—'}</strong></div>
      <div><span>CARDS</span><strong>{deck?.cards.length ?? 0}</strong></div>
      <div><span>STATE</span><strong>{selectedCard ? selectedCard.titleZh : drawPhase.toUpperCase()}</strong></div>
    </div>
  )
}
