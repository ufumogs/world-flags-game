import { useState, useCallback } from 'react'
import { soundManager } from '../utils/audio'
import type { SoundType } from '../utils/audio'

// Thin React wrapper around the SoundManager singleton.
//
// Responsibility split:
//   SoundManager — owns AudioContext, enabled state, localStorage persistence
//   useSound     — keeps React's UI state in sync so the toggle button re-renders
//
// Components call play() for sounds and toggle() for the mute button.
// They never interact with soundManager directly.

export function useSound() {
  // Initialise from the singleton so the stored preference is respected on mount
  const [enabled, setEnabled] = useState(() => soundManager.enabled)

  const toggle = useCallback(() => {
    const next = !soundManager.enabled
    soundManager.setEnabled(next)
    setEnabled(next)
    // Play a confirmation click when turning sound ON (not when muting — no sound)
    if (next) soundManager.play('click')
  }, [])

  const play = useCallback((type: SoundType) => {
    soundManager.play(type)
  }, [])

  return { enabled, toggle, play }
}
