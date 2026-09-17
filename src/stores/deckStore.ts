import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { builtInDeck, builtInDecks } from '../data/mockDeck'
import type { DeckLanguage, ExperienceMode, KnowledgeCard, KnowledgeDeck } from '../types'

interface CreateDeckInput {
  name: string
  language: DeckLanguage
  category: string
  mode?: ExperienceMode
}

interface DeckState {
  decks: KnowledgeDeck[]
  activeDeckId: string
  setActiveDeck: (id: string) => void
  createDeck: (input: CreateDeckInput) => string
  renameDeck: (id: string, name: string) => void
  duplicateDeck: (id: string) => string | null
  deleteDeck: (id: string) => void
  addCards: (deckId: string, cards: KnowledgeCard[]) => void
  updateCard: (deckId: string, card: KnowledgeCard) => void
  deleteCard: (deckId: string, cardId: string) => void
  setCardStudyState: (deckId: string, cardId: string, state: 'question' | 'revealed') => void
}

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`

export const useDeckStore = create<DeckState>()(persist((set, get) => ({
  decks: builtInDecks,
  activeDeckId: builtInDeck.id,
  setActiveDeck: (activeDeckId) => set({ activeDeckId }),
  createDeck: ({ name, language, category, mode = 'creator' }) => {
    const now = new Date().toISOString()
    const id = makeId('deck')
    const deck: KnowledgeDeck = {
      id, name: name.trim(), language, category: category.trim() || 'GENERAL', cards: [], mode,
      shareSlug: name.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-'),
      createdAt: now, updatedAt: now,
    }
    set((state) => ({ decks: [...state.decks, deck], activeDeckId: id }))
    return id
  },
  renameDeck: (id, name) => set((state) => ({ decks: state.decks.map((deck) => deck.id === id ? { ...deck, name, updatedAt: new Date().toISOString() } : deck) })),
  duplicateDeck: (id) => {
    const source = get().decks.find((deck) => deck.id === id)
    if (!source) return null
    const now = new Date().toISOString()
    const newId = makeId('deck')
    const copy: KnowledgeDeck = {
      ...source,
      id: newId,
      name: `${source.name} COPY`,
      isBuiltIn: false,
      cards: source.cards.map((item) => ({ ...item, id: makeId('card'), createdAt: now })),
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({ decks: [...state.decks, copy], activeDeckId: newId }))
    return newId
  },
  deleteDeck: (id) => set((state) => {
    const target = state.decks.find((deck) => deck.id === id)
    if (!target || target.isBuiltIn) return state
    const decks = state.decks.filter((deck) => deck.id !== id)
    return { decks, activeDeckId: state.activeDeckId === id ? builtInDeck.id : state.activeDeckId }
  }),
  addCards: (deckId, cards) => set((state) => ({
    decks: state.decks.map((deck) => deck.id === deckId
      ? { ...deck, cards: [...deck.cards, ...cards], updatedAt: new Date().toISOString() }
      : deck),
  })),
  updateCard: (deckId, card) => set((state) => ({
    decks: state.decks.map((deck) => deck.id === deckId
      ? { ...deck, cards: deck.cards.map((item) => item.id === card.id ? card : item), updatedAt: new Date().toISOString() }
      : deck),
  })),
  deleteCard: (deckId, cardId) => set((state) => ({
    decks: state.decks.map((deck) => deck.id === deckId
      ? { ...deck, cards: deck.cards.filter((card) => card.id !== cardId), updatedAt: new Date().toISOString() }
      : deck),
  })),
  setCardStudyState: (deckId, cardId, studyState) => set((state) => ({
    decks: state.decks.map((deck) => deck.id === deckId
      ? { ...deck, cards: deck.cards.map((card) => card.id === cardId ? { ...card, studyState } : card) }
      : deck),
  })),
}), {
  name: 'knowledge-orbit-decks-v15',
  storage: createJSONStorage(() => localStorage),
  version: 3,
  migrate: (persistedState) => {
    const previous = persistedState as Partial<DeckState>
    const previousDecks = Array.isArray(previous.decks) ? previous.decks : []
    const personalDecks = previousDecks.filter((deck) => !deck.isBuiltIn)
    const catalogTerms = new Set(builtInDecks.flatMap((deck) => deck.cards.map((card) => card.titleEn.trim().toLocaleLowerCase())))
    const recoveredCards = previousDecks
      .filter((deck) => deck.isBuiltIn)
      .flatMap((deck) => deck.cards)
      .filter((card) => !catalogTerms.has(card.titleEn.trim().toLocaleLowerCase()))
    const seededDecks = builtInDecks.map((deck, index) => index === 0 && recoveredCards.length > 0
      ? { ...deck, cards: [...deck.cards, ...recoveredCards] }
      : deck)
    const activeDeckId = personalDecks.some((deck) => deck.id === previous.activeDeckId)
      ? previous.activeDeckId as string
      : builtInDeck.id

    return { ...previous, decks: [...seededDecks, ...personalDecks], activeDeckId }
  },
}))

export const selectActiveDeck = (state: DeckState) => state.decks.find((deck) => deck.id === state.activeDeckId) ?? state.decks[0]
