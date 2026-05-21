export type Continent = 'africa' | 'americas' | 'asia' | 'europe' | 'oceania'

export interface Country {
  name: string
  code: string       // ISO 3166-1 alpha-2, lowercase — matches flagcdn.com
  continent: Continent
  isCommon: boolean  // top ~80 well-known countries, for a future beginner mode
}

export interface Question {
  correct: Country
  options: Country[] // always length 4, shuffled, includes correct
  id: string         // stable React key
}

export type QuizMode = 'name-to-flag' | 'flag-to-name'

export type AnswerStatus = 'correct' | 'incorrect'

export interface AnswerRecord {
  question: Question
  selectedCode: string
  status: AnswerStatus
  answeredAt: number
}

export type GamePhase = 'start' | 'playing' | 'finished'

// Top-level screen that App.tsx owns — separate from the quiz's GamePhase.
// Adding a new screen: add it here + one case in App.tsx JSX. Nothing else changes.
export type AppScreen = 'menu' | 'quiz' | 'settings'

export interface QuizState {
  phase: GamePhase
  mode: QuizMode
  questions: Question[]
  currentIndex: number
  answers: AnswerRecord[]
  score: number
  totalQuestions: number
}

export interface QuizConfig {
  totalQuestions: number
  continents: Continent[] | 'all'
  mode: QuizMode
  difficulty: 'common' | 'all'
}
