import { Aperture, Hand, Library, Settings2, Video, Volume2, VolumeX } from 'lucide-react'
import { soundManager } from '../services/SoundManager'
import { useExperienceStore } from '../stores/experienceStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useUIStore } from '../stores/uiStore'

export function Header() {
  const creatorMode = useExperienceStore((state) => state.creatorMode)
  const toggleCreatorMode = useExperienceStore((state) => state.toggleCreatorMode)
  const soundMuted = useSettingsStore((state) => state.soundMuted)
  const gestureEnabled = useSettingsStore((state) => state.gestureEnabled)
  const openWorkbench = useUIStore((state) => state.openWorkbench)

  const toggleSound = () => {
    void soundManager.unlock()
    soundManager.setMuted(!soundMuted)
  }

  return (
    <header className="app-header">
      <button className="brand" type="button" aria-label="Knowledge Orbit home">
        <span className="brand-mark"><Aperture size={17} strokeWidth={1.3} /></span>
        <span className="brand-word">KNOWLEDGE / ORBIT</span>
        <span className="brand-version">V1.5</span>
      </button>
      <nav className="primary-nav" aria-label="Primary navigation">
        <button
          type="button"
          className={`gesture-toggle ${gestureEnabled ? 'is-active' : ''}`}
          onClick={() => openWorkbench('gesture')}
          aria-label={`Gesture control, currently ${gestureEnabled ? 'on' : 'off'}`}
        >
          <Hand size={14} /> <span>GESTURE</span> <em>{gestureEnabled ? 'ON' : 'OFF'}</em>
        </button>
        {!creatorMode && (
          <>
            <button type="button" onClick={() => openWorkbench('library')}><Library size={14} /> MY DECKS</button>
            <button type="button" onClick={toggleSound} aria-label={soundMuted ? 'Turn sound on' : 'Mute sound'}>
              {soundMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <button type="button" onClick={() => openWorkbench('settings')} aria-label="Settings"><Settings2 size={15} /></button>
          </>
        )}
        <button
          type="button"
          className={`creator-toggle ${creatorMode ? 'is-active' : ''}`}
          onClick={toggleCreatorMode}
        >
          <Video size={14} /> {creatorMode ? 'EXIT CREATOR' : 'CREATOR MODE'}
        </button>
      </nav>
    </header>
  )
}
