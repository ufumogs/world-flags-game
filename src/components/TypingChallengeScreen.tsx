import { memo, useEffect, useRef, useState } from 'react'
import type { Country, TypingChallengeState } from '../types'
import { findCountryMatch } from '../utils/countryMatching'
import { getFlagUrl } from '../utils/flagUrl'
import { Button } from './ui/Button'

interface TypingChallengeScreenProps {
  state: TypingChallengeState
  solvedCount: number
  solvedSet: ReadonlySet<string>
  onGuess: (value: string) => void
  onSolved: () => void
  onRestart: () => void
}

interface FlagTypingTileProps {
  country: Country
  isSolved: boolean
}

const FlagTypingTile = memo(function FlagTypingTile({
  country,
  isSolved,
}: FlagTypingTileProps) {
  return (
    <div
      className={`
        group relative overflow-hidden rounded-lg border bg-white shadow-sm
        transition-all duration-200
        ${isSolved
          ? 'border-emerald-300 ring-2 ring-emerald-200 scale-[0.98]'
          : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
        }
      `}
    >
      <div className="aspect-[3/2] bg-slate-50 p-1.5">
        <img
          src={getFlagUrl(country.code, 160)}
          alt={isSolved ? `Flag of ${country.name}` : 'Unsolved flag'}
          className={`
            h-full w-full object-contain drop-shadow-sm transition-all duration-200
            ${isSolved ? 'opacity-35 saturate-50' : 'opacity-100'}
          `}
          loading="lazy"
        />
      </div>

      {isSolved && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-500/90 px-1 text-center text-white">
          <div className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-black text-emerald-600">
            ✓
          </div>
          <p className="max-w-full truncate text-xs font-black">
            {country.name}
          </p>
        </div>
      )}
    </div>
  )
})

export function TypingChallengeScreen({
  state,
  solvedCount,
  solvedSet,
  onGuess,
  onSolved,
  onRestart,
}: TypingChallengeScreenProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isFinished = state.phase === 'finished'
  const progress = state.totalFlags > 0 ? (solvedCount / state.totalFlags) * 100 : 0

  function focusInput() {
    if (!isFinished) inputRef.current?.focus()
  }

  useEffect(() => {
    focusInput()
  })

  function handleChange(nextValue: string) {
    const match = findCountryMatch(nextValue, state.countries, solvedSet)

    if (match) {
      onGuess(nextValue)
      onSolved()
      setValue('')
      requestAnimationFrame(focusInput)
      return
    }

    setValue(nextValue)
  }

  return (
    <div
      className="w-full max-w-6xl mx-auto px-4 py-5"
      onMouseDown={focusInput}
    >
      <div className="sticky top-[57px] z-10 -mx-4 mb-5 border-b border-blue-100 bg-slate-50/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label htmlFor="typing-answer" className="sr-only">
              Type a country name
            </label>
            <input
              ref={inputRef}
              id="typing-answer"
              value={value}
              onChange={event => handleChange(event.target.value)}
              onBlur={() => window.setTimeout(focusInput, 0)}
              disabled={isFinished}
              placeholder={isFinished ? 'All flags solved' : 'Type a country name...'}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="
                w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3
                text-base font-bold text-slate-800 shadow-sm outline-none
                transition-colors placeholder:text-slate-400
                focus:border-blue-500 focus:ring-4 focus:ring-blue-100
                disabled:border-emerald-200 disabled:bg-emerald-50 disabled:text-emerald-700
              "
            />
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <div className="rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200">
              {solvedCount}
              <span className="text-slate-400"> / {state.totalFlags}</span>
            </div>
            <Button size="sm" variant="secondary" onClick={onRestart}>
              Restart
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-3 h-2 max-w-4xl overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {isFinished && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">
          Perfect run. Every flag is solved.
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
        {state.countries.map(country => (
          <FlagTypingTile
            key={country.code}
            country={country}
            isSolved={solvedSet.has(country.code)}
          />
        ))}
      </div>
    </div>
  )
}
