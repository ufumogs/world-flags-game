import { flagSimilarityGroups } from '../data/flagSimilarityGroups'
import type { SimilarityDifficulty } from '../types'

interface SimilarityCandidate {
  code: string
  score: number
  difficulty: SimilarityDifficulty
  groupIds: string[]
}

const DIFFICULTY_WEIGHT: Record<SimilarityDifficulty, number> = {
  medium: 1,
  hard: 2,
  expert: 3,
}

function compareDifficulty(
  a: SimilarityDifficulty,
  b: SimilarityDifficulty
): SimilarityDifficulty {
  return DIFFICULTY_WEIGHT[a] >= DIFFICULTY_WEIGHT[b] ? a : b
}

export function getSimilarityCandidates(countryCode: string): SimilarityCandidate[] {
  const candidateMap = new Map<string, SimilarityCandidate>()

  for (const group of flagSimilarityGroups) {
    const countries: readonly string[] = group.countries
    if (!countries.includes(countryCode)) continue

    for (const code of countries) {
      if (code === countryCode) continue

      const existing = candidateMap.get(code)
      if (existing) {
        existing.score += DIFFICULTY_WEIGHT[group.difficulty]
        existing.difficulty = compareDifficulty(existing.difficulty, group.difficulty)
        existing.groupIds.push(group.id)
      } else {
        candidateMap.set(code, {
          code,
          score: DIFFICULTY_WEIGHT[group.difficulty],
          difficulty: group.difficulty,
          groupIds: [group.id],
        })
      }
    }
  }

  return [...candidateMap.values()].sort((a, b) => b.score - a.score)
}
