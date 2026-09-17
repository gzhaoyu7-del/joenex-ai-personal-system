import { Plus } from 'lucide-react'
import { selectActiveDeck, useDeckStore } from '../stores/deckStore'
import { useExperienceStore } from '../stores/experienceStore'
import { useUIStore } from '../stores/uiStore'

export function FieldIndex() {
  const decks = useDeckStore((state) => state.decks)
  const activeDeck = useDeckStore(selectActiveDeck)
  const setActiveDeck = useDeckStore((state) => state.setActiveDeck)
  const clearSelection = useExperienceStore((state) => state.clearSelection)
  const openWorkbench = useUIStore((state) => state.openWorkbench)

  const chooseDeck = (id: string) => {
    setActiveDeck(id)
    clearSelection()
  }

  return (
    <aside className="field-index" aria-label="My knowledge decks">
      <div className="field-index__heading">
        <span>KNOWLEDGE DECKS</span>
        <span>{String(decks.length).padStart(2, '0')}</span>
      </div>
      <div className="field-index__items">
        {decks.map((deck, index) => (
          <button
            key={deck.id}
            className={activeDeck?.id === deck.id ? 'is-active' : ''}
            type="button"
            onClick={() => chooseDeck(deck.id)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{deck.name}</strong>
            <em>{deck.cards.length}</em>
          </button>
        ))}
        <button className="new-deck-index" type="button" onClick={() => openWorkbench('create')}>
          <span><Plus size={10} /></span>
          <strong>NEW DECK</strong>
          <em>CREATE</em>
        </button>
      </div>
    </aside>
  )
}
