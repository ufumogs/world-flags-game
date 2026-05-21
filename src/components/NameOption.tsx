import type { Country } from '../types'

interface NameOptionProps {
  country: Country
  index: number
  isSelected: boolean
  isCorrect: boolean
  isAnswered: boolean
  onSelect: () => void
}

export function NameOption({
  country,
  index,
  isSelected,
  isCorrect,
  isAnswered,
  onSelect,
}: NameOptionProps) {
  // ── Derive visual state ───────────────────────────────────────────────────────
  // Mirrors FlagOption's five-state logic, adapted for a text button.
  // All three classes change together so the whole row shifts colour — not just
  // the badge — matching the same "whole card changes" feel as the flag cards.

  let bgClass     = 'bg-white'
  let borderClass = 'border-slate-200'
  let textClass   = 'text-slate-700'
  let badgeBg     = 'bg-slate-700/70'

  if (isAnswered) {
    if (isCorrect) {
      bgClass     = 'bg-green-50'
      borderClass = 'border-green-500'
      textClass   = 'text-green-800'
      badgeBg     = 'bg-green-500'
    } else if (isSelected) {
      bgClass     = 'bg-red-50'
      borderClass = 'border-red-400'
      textClass   = 'text-red-800'
      badgeBg     = 'bg-red-500'
    } else {
      bgClass     = 'bg-white'
      borderClass = 'border-slate-100'
      textClass   = 'text-slate-400'
    }
  }

  return (
    <button
      onClick={isAnswered ? undefined : onSelect}
      disabled={isAnswered}
      aria-label={isAnswered ? country.name : `Option ${index + 1}`}
      aria-pressed={isSelected}
      className={`
        relative w-full flex items-center gap-3 px-4 py-3.5
        rounded-xl border-2 text-left
        transition-all duration-200
        ${bgClass} ${borderClass}
        ${!isAnswered
          ? 'hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]'
          : 'cursor-default'
        }
        ${isAnswered && !isCorrect && !isSelected ? 'opacity-50' : ''}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
      `}
    >
      {/* Keyboard shortcut badge */}
      <span
        className={`
          shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white
          ${badgeBg}
        `}
        aria-hidden="true"
      >
        {index + 1}
      </span>

      {/* Country name */}
      <span className={`flex-1 text-sm font-semibold leading-tight ${textClass}`}>
        {country.name}
      </span>

      {/* Result icon — replaces the badge visual weight on the right */}
      {isAnswered && isCorrect && (
        <svg className="shrink-0 w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      )}
      {isAnswered && isSelected && !isCorrect && (
        <svg className="shrink-0 w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  )
}
