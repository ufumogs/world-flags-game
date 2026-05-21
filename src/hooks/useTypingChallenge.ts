import { useCallback, useMemo, useReducer } from 'react'
import rawCountries from '../data/countries.json'
import type {
  Country,
  TypingChallengeConfig,
  TypingChallengeState,
} from '../types'
import { findCountryMatch } from '../utils/countryMatching'

const allCountries = rawCountries as Country[]

type TypingAction =
  | { type: 'START'; config: TypingChallengeConfig }
  | { type: 'GUESS'; value: string }
  | { type: 'RESTART' }

const initialState: TypingChallengeState = {
  phase: 'start',
  countries: [],
  solvedCodes: {},
  startedAt: null,
  completedAt: null,
  totalFlags: 0,
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function getPool(config: TypingChallengeConfig): Country[] {
  let pool = allCountries

  if (config.difficulty === 'common') {
    pool = pool.filter(country => country.isCommon)
  }

  if (config.continents !== 'all') {
    pool = pool.filter(country => config.continents.includes(country.continent))
  }

  return pool
}

function typingReducer(
  state: TypingChallengeState,
  action: TypingAction
): TypingChallengeState {
  switch (action.type) {
    case 'START': {
      const pool = getPool(action.config)
      const countries = shuffle(pool).slice(0, action.config.totalFlags)

      return {
        phase: 'playing',
        countries,
        solvedCodes: {},
        startedAt: Date.now(),
        completedAt: null,
        totalFlags: countries.length,
      }
    }

    case 'GUESS': {
      if (state.phase !== 'playing') return state

      const solvedSet = new Set(Object.keys(state.solvedCodes))
      const match = findCountryMatch(action.value, state.countries, solvedSet)
      if (!match) return state

      const solvedCodes = {
        ...state.solvedCodes,
        [match.code]: Date.now(),
      }
      const isComplete = Object.keys(solvedCodes).length >= state.totalFlags

      return {
        ...state,
        phase: isComplete ? 'finished' : 'playing',
        solvedCodes,
        completedAt: isComplete ? Date.now() : null,
      }
    }

    case 'RESTART':
      return initialState
  }
}

export function useTypingChallenge() {
  const [state, dispatch] = useReducer(typingReducer, initialState)

  const solvedCount = Object.keys(state.solvedCodes).length
  const solvedSet = useMemo(
    () => new Set(Object.keys(state.solvedCodes)),
    [state.solvedCodes]
  )

  const start = useCallback((config: TypingChallengeConfig) => {
    dispatch({ type: 'START', config })
  }, [])

  const guess = useCallback((value: string) => {
    dispatch({ type: 'GUESS', value })
  }, [])

  const restart = useCallback(() => {
    dispatch({ type: 'RESTART' })
  }, [])

  return {
    state,
    solvedCount,
    solvedSet,
    start,
    guess,
    restart,
  }
}
