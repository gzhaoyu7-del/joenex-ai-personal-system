import { useEffect, useRef } from 'react'
import { useExperienceStore } from '../../stores/experienceStore'
import { useSettingsStore } from '../../stores/settingsStore'
import type { GestureAction } from '../../types'
import { gestureManager } from './gestureService'

export function GestureController() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const gestureEnabled = useSettingsStore((state) => state.gestureEnabled)
  const setGestureStatus = useSettingsStore((state) => state.setGestureStatus)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (!gestureEnabled) {
      const experience = useExperienceStore.getState()
      if (['accelerating', 'velocity', 'decelerating'].includes(experience.drawPhase)) experience.requestLock()
      gestureManager.disable(video)
      setGestureStatus('off', 'GESTURE OFFLINE')
      return
    }

    const handleAction = (action: GestureAction) => {
      const experience = useExperienceStore.getState()
      if (action === 'draw') experience.requestGestureSpin()
      if (action === 'lock') experience.requestLock()
      if (action === 'swipe-left') experience.requestRotate(-1)
      if (action === 'swipe-right') experience.requestRotate(1)
      if (action === 'select') experience.requestSelect()
    }

    void gestureManager.enable(video, handleAction, setGestureStatus).catch(() => {
      // Keep the error visible so the user can act on camera/model failures.
    })
    return () => gestureManager.disable(video)
  }, [gestureEnabled, setGestureStatus])

  return <video ref={videoRef} className="gesture-video" aria-hidden="true" />
}
