export type DeckLanguage = 'bilingual' | 'zh' | 'en'
export type ExperienceMode = 'creator' | 'study'
export type CardStudyState = 'question' | 'revealed'

export interface KnowledgeCard {
  id: string
  titleZh: string
  titleEn: string
  shortEn?: string
  descriptionZh?: string
  descriptionEn?: string
  category: string
  tags?: string[]
  source?: string
  importance?: number
  studyState?: CardStudyState
  createdAt: string
}

export interface KnowledgeDeck {
  id: string
  name: string
  language: DeckLanguage
  category: string
  cards: KnowledgeCard[]
  mode: ExperienceMode
  isBuiltIn?: boolean
  shareSlug?: string
  createdAt: string
  updatedAt: string
}

export interface ExtractedDocument {
  name: string
  text: string
  pageCount: number
  wordCount: number
  sourceType: 'pdf' | 'text'
}

export interface AIExtractionResult {
  deckTitle: string
  cards: KnowledgeCard[]
}

export type DrawPhase = 'idle' | 'accelerating' | 'velocity' | 'decelerating' | 'locking' | 'revealed'
export type PreviewFrame = 'none' | '16:9' | '9:16'
export type WorkbenchView = 'create' | 'add' | 'batch' | 'import' | 'preview' | 'library' | 'gesture' | 'settings' | null
export type ImportMethod = 'text' | 'pdf' | 'list'
export type GestureStatus = 'off' | 'loading' | 'searching' | 'detected' | 'error'
export type GestureAction = 'draw' | 'lock' | 'swipe-left' | 'swipe-right' | 'select'
