import type { Country, Question } from '../types'

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

// Build a single Question with 4 shuffled options (1 correct + 3 distractors).
function buildQuestion(correct: Country, pool: Country[]): Question {
  const distractors = pickDistractors(pool, correct, 3)
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
export function buildQuiz(pool: Country[], count: number): Question[] {
  const shuffledPool = shuffle(pool)
  const correctCountries = shuffledPool.slice(0, count)
  return correctCountries.map(country => buildQuestion(country, pool))
}
