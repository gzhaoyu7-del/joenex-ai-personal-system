import { create } from 'zustand'
import type { DrawPhase, KnowledgeCard, PreviewFrame } from '../types'

interface ExperienceState {
  creatorMode: boolean
  previewFrame: PreviewFrame
  drawRunId: number
  gestureSpinRunId: number
  lockRunId: number
  rotateRunId: number
  rotateDirection: -1 | 1
  selectRunId: number
  drawPhase: DrawPhase
  selectedCard: KnowledgeCard | null
  toggleCreatorMode: () => void
  setPreviewFrame: (frame: PreviewFrame) => void
  requestDraw: () => void
  requestGestureSpin: () => void
  requestLock: () => void
  requestRotate: (direction: -1 | 1) => void
  requestSelect: () => void
  setDrawPhase: (phase: DrawPhase) => void
  revealCard: (card: KnowledgeCard) => void
  clearSelection: () => void
}

export const useExperienceStore = create<ExperienceState>((set, get) => ({
  creatorMode: false,
  previewFrame: 'none',
  drawRunId: 0,
  gestureSpinRunId: 0,
  lockRunId: 0,
  rotateRunId: 0,
  rotateDirection: 1,
  selectRunId: 0,
  drawPhase: 'idle',
  selectedCard: null,
  toggleCreatorMode: () => set((state) => ({
    creatorMode: !state.creatorMode,
    previewFrame: !state.creatorMode ? '9:16' : 'none',
  })),
  setPreviewFrame: (previewFrame) => set({ previewFrame }),
  requestDraw: () => {
    if (!['idle', 'revealed'].includes(get().drawPhase)) return
    set((state) => ({ drawRunId: state.drawRunId + 1, drawPhase: 'accelerating', selectedCard: null }))
  },
  requestGestureSpin: () => {
    if (!['idle', 'revealed'].includes(get().drawPhase)) return
    set((state) => ({ gestureSpinRunId: state.gestureSpinRunId + 1, drawPhase: 'accelerating', selectedCard: null }))
  },
  requestLock: () => {
    if (['accelerating', 'velocity', 'decelerating'].includes(get().drawPhase)) {
      set((state) => ({ lockRunId: state.lockRunId + 1 }))
    }
  },
  requestRotate: (rotateDirection) => set((state) => ({ rotateRunId: state.rotateRunId + 1, rotateDirection })),
  requestSelect: () => set((state) => ({ selectRunId: state.selectRunId + 1 })),
  setDrawPhase: (drawPhase) => set({ drawPhase }),
  revealCard: (selectedCard) => set({ selectedCard, drawPhase: 'revealed' }),
  clearSelection: () => set({ selectedCard: null, drawPhase: 'idle' }),
}))
