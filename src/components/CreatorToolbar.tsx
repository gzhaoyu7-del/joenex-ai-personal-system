import { useExperienceStore } from '../stores/experienceStore'
import type { PreviewFrame } from '../types'

const frames: { value: PreviewFrame; label: string }[] = [
  { value: 'none', label: 'FULL' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16 SAFE' },
]

export function CreatorToolbar() {
  const creatorMode = useExperienceStore((state) => state.creatorMode)
  const previewFrame = useExperienceStore((state) => state.previewFrame)
  const setPreviewFrame = useExperienceStore((state) => state.setPreviewFrame)
  if (!creatorMode) return null

  return (
    <div className="creator-toolbar">
      <span>FRAME</span>
      {frames.map((frame) => (
        <button
          type="button"
          key={frame.value}
          className={previewFrame === frame.value ? 'is-active' : ''}
          onClick={() => setPreviewFrame(frame.value)}
        >
          {frame.label}
        </button>
      ))}
    </div>
  )
}
