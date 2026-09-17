import { FileInput, Plus } from 'lucide-react'
import { useExperienceStore } from '../stores/experienceStore'
import { useUIStore } from '../stores/uiStore'

export function HomeActions() {
  const creatorMode = useExperienceStore((state) => state.creatorMode)
  const openWorkbench = useUIStore((state) => state.openWorkbench)
  if (creatorMode) return null
  return (
    <div className="home-actions" aria-label="Knowledge deck actions">
      <button type="button" onClick={() => openWorkbench('create')}><Plus size={13} /> CREATE</button>
      <span>DRAW</span>
      <button type="button" onClick={() => openWorkbench('import')}><FileInput size={13} /> IMPORT</button>
    </div>
  )
}
