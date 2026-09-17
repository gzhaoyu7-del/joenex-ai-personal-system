import { AnimatePresence, motion } from 'framer-motion'
import { useExperienceStore } from '../../stores/experienceStore'

export function CreatorFrame() {
  const creatorMode = useExperienceStore((state) => state.creatorMode)
  const previewFrame = useExperienceStore((state) => state.previewFrame)

  return (
    <AnimatePresence>
      {creatorMode && previewFrame !== 'none' && (
        <motion.div
          className={`creator-frame creator-frame--${previewFrame.replace(':', '-')}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32 }}
          aria-hidden="true"
        >
          <span className="frame-label">CREATOR SAFE / {previewFrame}</span>
          <i className="frame-corner frame-corner--tl" />
          <i className="frame-corner frame-corner--tr" />
          <i className="frame-corner frame-corner--bl" />
          <i className="frame-corner frame-corner--br" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
