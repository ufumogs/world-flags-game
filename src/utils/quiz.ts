import type { Country, Question, QuizChallenge } from '../types'
import { getSimilarityCandidates } from './flagSimilarity'

interface BuildQuizOptions {
  challenge?: QuizChallenge
}

// Fisher-Yates shuffle — O(n), returns a new array without mutating the input.
function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Pick `count` unique countries from pool that are NOT the correct answer.
function pickDistractors(pool: Country[], exclude: Country, count: number): Country[] {
  const candidates = pool.filter(c => c.code !== exclude.code)
  return shuffle(candidates).slice(0, count)
}

function pickSimilarDistractors(pool: Country[], exclude: Country, count: number): Country[] {
  const poolByCode = new Map(pool.map(country => [country.code, country]))
  const selected = new Map<string, Country>()

  const similarCandidates = getSimilarityCandidates(exclude.code)
    .map(candidate => ({
      country: poolByCode.get(candidate.code),
      score: candidate.score,
    }))
    .filter((candidate): candidate is { country: Country; score: number } =>
      candidate.country !== undefined
    )

  const rankedSimilarCandidates = shuffle(similarCandidates)
    .sort((a, b) => b.score - a.score)

  for (const { country } of rankedSimilarCandidates) {
    if (country.code !== exclude.code && !selected.has(country.code)) {
      selected.set(country.code, country)
    }
    if (selected.size === count) return [...selected.values()]
  }

  const fallbackCandidates = pool.filter(country =>
    country.code !== exclude.code && !selected.has(country.code)
  )

  for (const country of shuffle(fallbackCandidates)) {
    selected.set(country.code, country)
    if (selected.size === count) break
  }

  return [...selected.values()]
}

// Build a single Question with 4 shuffled options (1 correct + 3 distractors).
function buildQuestion(
  correct: Country,
  pool: Country[],
  challenge: QuizChallenge
): Question {
  const distractors = challenge === 'similar-flags'
    ? pickSimilarDistractors(pool, correct, 3)
    : pickDistractors(pool, correct, 3)
  const options = shuffle([correct, ...distractors])
  return {
    correct,
    options,
    id: `${correct.code}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  }
}

// Build the full quiz question list.
// Invariants:
//   - No country repeats as the correct answer within a session.
//   - A country CAN appear as a distractor in multiple questions (realistic, intentional).
//   - Each question has exactly 4 options, exactly 1 of which is correct.
export function buildQuiz(
  pool: Country[],
  count: number,
  options: BuildQuizOptions = {}
): Question[] {
  const challenge = options.challenge ?? 'standard'
  const shuffledPool = shuffle(pool)
  const correctCountries = shuffledPool.slice(0, count)
  return correctCountries.map(country => buildQuestion(country, pool, challenge))
}
