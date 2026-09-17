import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { GestureStatus } from '../types'

interface SettingsState {
  soundMuted: boolean
  soundVolume: number
  openRouterKey: string
  openRouterModel: string
  gestureEnabled: boolean
  gestureStatus: GestureStatus
  gestureMessage: string
  setSoundMuted: (muted: boolean) => void
  setSoundVolume: (volume: number) => void
  setOpenRouterKey: (key: string) => void
  setOpenRouterModel: (model: string) => void
  setGestureEnabled: (enabled: boolean) => void
  setGestureStatus: (status: GestureStatus, message?: string) => void
}

export const useSettingsStore = create<SettingsState>()(persist((set) => ({
  soundMuted: false,
  soundVolume: 0.56,
  openRouterKey: '',
  openRouterModel: 'google/gemini-2.5-flash',
  gestureEnabled: false,
  gestureStatus: 'off',
  gestureMessage: 'GESTURE OFFLINE',
  setSoundMuted: (soundMuted) => set({ soundMuted }),
  setSoundVolume: (soundVolume) => set({ soundVolume }),
  setOpenRouterKey: (openRouterKey) => set({ openRouterKey }),
  setOpenRouterModel: (openRouterModel) => set({ openRouterModel }),
  setGestureEnabled: (gestureEnabled) => set({ gestureEnabled }),
  setGestureStatus: (gestureStatus, gestureMessage = gestureStatus.toUpperCase()) => set({ gestureStatus, gestureMessage }),
}), {
  name: 'knowledge-orbit-settings-v15',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    soundMuted: state.soundMuted,
    soundVolume: state.soundVolume,
    openRouterKey: state.openRouterKey,
    openRouterModel: state.openRouterModel,
  }),
}))
