import { useReducer, useCallback } from 'react'
import type { QuizState, QuizConfig, AnswerRecord } from '../types'
import { buildQuiz } from '../utils/quiz'
import rawCountries from '../data/countries.json'
import type { Country } from '../types'

const allCountries = rawCountries as Country[]

// --- Action types (local — no need to export, only useQuiz uses them) ---
type QuizAction =
  | { type: 'START'; config: QuizConfig }
  | { type: 'ANSWER'; selectedCode: string }
  | { type: 'NEXT' }
  | { type: 'RESTART' }

// --- Initial state ---
const initialState: QuizState = {
  phase: 'start',
  mode: 'name-to-flag',
  questions: [],
  currentIndex: 0,
  answers: [],
  score: 0,
  totalQuestions: 0,
}

// --- Reducer ---
// ANSWER and NEXT are deliberately separate actions.
// ANSWER fires immediately on click (shows correct/wrong highlight).
// NEXT fires 1.2s later via a setTimeout in App.tsx (gives the user time to see feedback).
function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'START': {
      const { config } = action
      let pool = allCountries

      if (config.difficulty === 'common') {
        pool = pool.filter(c => c.isCommon)
      }
      if (config.continents !== 'all') {
        pool = pool.filter(c =>
          (config.continents as string[]).includes(c.continent)
        )
      }

      const count = Math.min(config.totalQuestions, pool.length)
      const questions = buildQuiz(pool, count)

      return {
        phase: 'playing',
        mode: config.mode,
        questions,
        currentIndex: 0,
        answers: [],
        score: 0,
        totalQuestions: count,
      }
    }

    case 'ANSWER': {
      // Ignore if the current question was already answered
      if (state.answers[state.currentIndex]) return state

      const question = state.questions[state.currentIndex]
      const isCorrect = action.selectedCode === question.correct.code

      const record: AnswerRecord = {
        question,
        selectedCode: action.selectedCode,
        status: isCorrect ? 'correct' : 'incorrect',
        answeredAt: Date.now(),
      }

      return {
        ...state,
        answers: [...state.answers, record],
        score: isCorrect ? state.score + 1 : state.score,
      }
    }

    case 'NEXT': {
      const nextIndex = state.currentIndex + 1
      if (nextIndex >= state.totalQuestions) {
        return { ...state, phase: 'finished' }
      }
      return { ...state, currentIndex: nextIndex }
    }

    case 'RESTART': {
      return initialState
    }
  }
}

// --- Public hook ---
export function useQuiz() {
  const [state, dispatch] = useReducer(quizReducer, initialState)

  const start = useCallback((config: QuizConfig) => {
    dispatch({ type: 'START', config })
  }, [])

  const answer = useCallback((selectedCode: string) => {
    dispatch({ type: 'ANSWER', selectedCode })
  }, [])

  const next = useCallback(() => {
    dispatch({ type: 'NEXT' })
  }, [])

  const restart = useCallback(() => {
    dispatch({ type: 'RESTART' })
  }, [])

  return { state, start, answer, next, restart }
}
