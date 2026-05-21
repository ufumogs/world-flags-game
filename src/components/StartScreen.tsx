import { useState } from 'react'
import type { Continent, QuizConfig, QuizMode } from '../types'
import rawCountries from '../data/countries.json'
import type { Country } from '../types'

interface StartScreenProps {
  onStart: (config: QuizConfig) => void
}

// ── Static config ─────────────────────────────────────────────────────────────

const allCountries = rawCountries as Country[]

const MODES: Array<{
  value: QuizMode
  label: string
  description: string
  icon: string
}> = [
  {
    value: 'name-to-flag',
    label: 'Guess the Flag',
    description: 'Read a country name — pick the right flag',
    icon: '🎯',
  },
  {
    value: 'flag-to-name',
    label: 'Guess the Country',
    description: 'See a flag — name the country',
    icon: '🗺️',
  },
]

// 'All Regions' is separate so it can span the full row.
const CONTINENT_ALL = { value: 'all' as const, label: 'All Regions', emoji: '🌐' }
const CONTINENTS: Array<{ value: Continent; label: string; emoji: string }> = [
  { value: 'africa',   label: 'Africa',   emoji: '🌍' },
  { value: 'europe',   label: 'Europe',   emoji: '🏛️' },
  { value: 'asia',     label: 'Asia',     emoji: '🗼' },
  { value: 'americas', label: 'Americas', emoji: '🌎' },
  { value: 'oceania',  label: 'Oceania',  emoji: '🌊' },
]

// ── Pool-size helpers ─────────────────────────────────────────────────────────

function getPoolSize(continent: Continent | 'all'): number {
  if (continent === 'all') return allCountries.length
  return allCountries.filter(c => c.continent === continent).length
}

// Builds the count options dynamically from the pool size.
// Fixed steps [10, 20, 50] only appear when strictly less than the pool (avoids
// duplicating the 'All' entry). Pool size is always the last option, labelled "All".
function getAvailableCounts(poolSize: number): Array<{ value: number; label: string }> {
  const steps = [10, 20, 50]
  const result = steps
    .filter(n => n < poolSize)
    .map(n => ({ value: n, label: String(n) }))
  result.push({ value: poolSize, label: 'All' })
  return result
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StartScreen({ onStart }: StartScreenProps) {
  const [mode, setMode]           = useState<QuizMode>('name-to-flag')
  const [continent, setContinent] = useState<Continent | 'all'>('all')
  const [count, setCount]         = useState<number>(20)

  const poolSize        = getPoolSize(continent)
  const availableCounts = getAvailableCounts(poolSize)

  // Clamp count when continent changes to a smaller pool.
  function handleContinentChange(value: Continent | 'all') {
    const newPool = getPoolSize(value)
    setContinent(value)
    if (count > newPool) setCount(newPool)
  }

  // If the count is no longer in the available list, fall back to pool size ("All").
  const effectiveCount = availableCounts.find(a => a.value === count) ? count : poolSize

  function handleStart() {
    onStart({
      totalQuestions: effectiveCount,
      continents: continent === 'all' ? 'all' : [continent],
      mode,
      difficulty: 'all',
    })
  }

  return (
    <div className="w-full max-w-sm mx-auto px-4 py-4">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="text-center mb-9">
        {/* Icon tile — gradient square with rounded corners and glow shadow */}
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-300/50 mb-5 text-4xl select-none"
          aria-hidden="true"
        >
          🌍
        </div>
        <h1 className="text-5xl font-black tracking-tight mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Flags Quiz
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          How well do you know the world's flags?
        </p>
      </div>

      {/* ── Mode cards ───────────────────────────────────────────────────────── */}
      {/* Vertical stack of large interactive cards — each fills the container width.
          Selected card gets a blue→indigo gradient; unselected is white with a
          subtle border that sharpens to blue on hover.
          The radio indicator on the right gives an explicit affordance that this
          is a single-select, not a toggle. */}
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
        Choose your challenge
      </p>
      <div className="space-y-2.5 mb-8">
        {MODES.map(m => {
          const active = mode === m.value
          return (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              aria-pressed={active}
              className={`
                group w-full flex items-center gap-4 p-4 rounded-2xl border-2
                text-left transition-all duration-200
                ${active
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-transparent shadow-lg shadow-blue-300/40'
                  : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
                }
              `}
            >
              {/* Emoji icon tile */}
              <div
                className={`
                  w-12 h-12 rounded-xl text-2xl flex items-center justify-center shrink-0
                  transition-colors duration-200
                  ${active
                    ? 'bg-white/20'
                    : 'bg-slate-100 group-hover:bg-blue-50'
                  }
                `}
                aria-hidden="true"
              >
                {m.icon}
              </div>

              {/* Label + description */}
              <div className="flex-1 min-w-0">
                <p className={`font-extrabold text-sm leading-none mb-1 ${active ? 'text-white' : 'text-slate-800'}`}>
                  {m.label}
                </p>
                <p className={`text-xs leading-snug ${active ? 'text-blue-100' : 'text-slate-500'}`}>
                  {m.description}
                </p>
              </div>

              {/* Radio circle — border when unselected, filled when selected */}
              <div
                className={`
                  w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center
                  transition-colors duration-200
                  ${active
                    ? 'border-white bg-white'
                    : 'border-slate-300 group-hover:border-blue-400'
                  }
                `}
                aria-hidden="true"
              >
                {active && <div className="w-2 h-2 rounded-full bg-blue-500" />}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Continent picker ─────────────────────────────────────────────────── */}
      {/* "All Regions" is full-width and visually separate from the 5 continent
          buttons below it — making the hierarchy All > Specific clear at a glance.
          Continents split into 3+2 rows: 3 in the first row, 2 wider ones in the
          second. This avoids an orphaned single button in a three-column grid while
          also making the wider bottom buttons feel intentional (Americas and Oceania
          have longer names and appreciate the extra space). */}
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
        Where in the world?
      </p>
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-3 mb-6 space-y-2">
        {/* All Regions — full width */}
        <button
          onClick={() => handleContinentChange('all')}
          aria-pressed={continent === 'all'}
          className={`
            w-full flex items-center justify-center gap-2
            py-2.5 rounded-xl text-sm font-semibold
            transition-all duration-150
            ${continent === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }
          `}
        >
          <span aria-hidden="true">{CONTINENT_ALL.emoji}</span>
          {CONTINENT_ALL.label}
        </button>

        {/* Row 1: Africa, Europe, Asia */}
        <div className="grid grid-cols-3 gap-2">
          {CONTINENTS.slice(0, 3).map(c => {
            const active = continent === c.value
            return (
              <button
                key={c.value}
                onClick={() => handleContinentChange(c.value)}
                aria-pressed={active}
                className={`
                  flex flex-col items-center gap-1 py-2.5 rounded-xl
                  text-xs font-semibold transition-all duration-150
                  ${active
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }
                `}
              >
                <span className="text-base leading-none" aria-hidden="true">{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            )
          })}
        </div>

        {/* Row 2: Americas, Oceania — wider to avoid orphan */}
        <div className="grid grid-cols-2 gap-2">
          {CONTINENTS.slice(3).map(c => {
            const active = continent === c.value
            return (
              <button
                key={c.value}
                onClick={() => handleContinentChange(c.value)}
                aria-pressed={active}
                className={`
                  flex flex-col items-center gap-1 py-2.5 rounded-xl
                  text-xs font-semibold transition-all duration-150
                  ${active
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }
                `}
              >
                <span className="text-base leading-none" aria-hidden="true">{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Question count ───────────────────────────────────────────────────── */}
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
        How many rounds?
        {continent !== 'all' && (
          <span className="ml-2 font-normal normal-case text-slate-400/80 text-xs">
            {poolSize} flags available
          </span>
        )}
      </p>
      <div className="flex gap-2 mb-8">
        {availableCounts.map(({ value, label }) => {
          const active = effectiveCount === value
          return (
            <button
              key={value}
              onClick={() => setCount(value)}
              aria-pressed={active}
              className={`
                flex-1 py-3 rounded-xl text-sm font-bold
                transition-all duration-150
                ${active
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }
              `}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      {/* Gradient button with an arrow icon. Stronger shadow than earlier design:
          shadow-blue-300/50 gives a coloured glow that reinforces the gradient. */}
      <button
        onClick={handleStart}
        className="
          w-full py-4 rounded-2xl text-base font-extrabold text-white
          bg-gradient-to-r from-blue-500 to-indigo-600
          shadow-xl shadow-blue-300/50
          hover:shadow-blue-400/60 hover:from-blue-600 hover:to-indigo-700
          active:scale-[0.97]
          transition-all duration-150
          flex items-center justify-center gap-2
        "
      >
        Play Now
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </button>

      {/* ── Keyboard hint ─────────────────────────────────────────────────────── */}
      <p className="mt-5 text-center text-xs text-slate-400">
        Press{' '}
        <kbd className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-mono text-xs shadow-sm">1</kbd>
        {' '}–{' '}
        <kbd className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-mono text-xs shadow-sm">4</kbd>
        {' '}during the quiz to pick an answer
      </p>
    </div>
  )
}
