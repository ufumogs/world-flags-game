import type { HiddenFlagDifficulty, HiddenFlagReveal } from '../types'

interface RevealPreset {
  minSize: number
  maxSize: number
}

const REVEAL_PRESETS: Record<HiddenFlagDifficulty, RevealPreset> = {
  easy: {
    minSize: 26,
    maxSize: 32,
  },
  medium: {
    minSize: 18,
    maxSize: 23,
  },
  hard: {
    minSize: 12,
    maxSize: 16,
  },
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function generateHiddenFlagReveal(
  difficulty: HiddenFlagDifficulty = 'medium'
): HiddenFlagReveal {
  const preset = REVEAL_PRESETS[difficulty]
  const size = randomBetween(preset.minSize, preset.maxSize)
  const x = randomBetween(8, 100 - size - 8)
  const y = randomBetween(12, 100 - size - 12)

  return {
    difficulty,
    x,
    y,
    size,
    visibleRatio: (size * size) / 10000,
  }
}
