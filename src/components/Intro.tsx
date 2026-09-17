import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useExperienceStore } from '../stores/experienceStore'

const words = ['UNDERSTAND', 'EXPLAIN', 'CREATE']

export function Intro() {
  const drawPhase = useExperienceStore((state) => state.drawPhase)
  const creatorMode = useExperienceStore((state) => state.creatorMode)
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setWordIndex((index) => (index + 1) % words.length), 3200)
    return () => window.clearInterval(timer)
  }, [])

  if (creatorMode || drawPhase !== 'idle') return null

  return (
    <motion.div
      className="intro"
      style={{ x: '-50%' }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p>RANDOM KNOWLEDGE CHALLENGE</p>
      <h1>
        WHAT WILL YOU<br />
        <span className="intro-word-wrap">
          <AnimatePresence initial={false} mode="sync">
            <motion.span
              key={words[wordIndex]}
              initial={{ y: 20, opacity: 0, filter: 'blur(6px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -16, opacity: 0, filter: 'blur(6px)' }}
              transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
            >
              {words[wordIndex]}
            </motion.span>
          </AnimatePresence>
        </span>{' '}
        TODAY?
      </h1>
    </motion.div>
  )
}
