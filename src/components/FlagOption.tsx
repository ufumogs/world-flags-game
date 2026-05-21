import { useState } from 'react'
import type { Country } from '../types'
import { getFlagUrl } from '../utils/flagUrl'

interface FlagOptionProps {
  country: Country
  index: number
  isSelected: boolean
  isCorrect: boolean
  isAnswered: boolean
  onSelect: () => void
}

export function FlagOption({
  country,
  index,
  isSelected,
  isCorrect,
  isAnswered,
  onSelect,
}: FlagOptionProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  // ── Derive card visual state ─────────────────────────────────────────────────
  // The button background doubles as the "letterbox" colour — the area visible
  // around a flag that doesn't exactly match the 3:2 container. Using slate-50
  // (not white) makes that space read as a neutral display frame, not emptiness.
  // Green-50 / red-50 tint that same space when an answer is revealed, so the
  // whole card changes colour — not just the flag image.

  let borderClass = 'border-slate-200'
  let bgClass     = 'bg-slate-50'      // default — neutral frame colour
  let ringClass   = ''

  if (isAnswered) {
    if (isCorrect) {
      borderClass = 'border-green-500'
      bgClass     = 'bg-green-50'
      ringClass   = 'ring-2 ring-green-500 ring-offset-2'
    } else if (isSelected) {
      borderClass = 'border-red-400'
      bgClass     = 'bg-red-50'
      ringClass   = 'ring-2 ring-red-400 ring-offset-2'
    } else {
      borderClass = 'border-slate-100'
      bgClass     = 'bg-slate-50'
    }
  }

  const labelBg = isCorrect
    ? 'bg-green-500'
    : isSelected
    ? 'bg-red-500'
    : 'bg-slate-700/70'

  return (
    <button
      onClick={isAnswered ? undefined : onSelect}
      disabled={isAnswered}
      aria-label={isAnswered ? country.name : `Option ${index + 1}`}
      aria-pressed={isSelected}
      className={`
        relative w-full aspect-[3/2] rounded-xl border-2 overflow-hidden
        transition-all duration-200
        ${borderClass} ${bgClass} ${ringClass}
        ${!isAnswered
          ? 'hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer active:scale-95'
          : 'cursor-default'
        }
        ${isAnswered && !isCorrect && !isSelected ? 'opacity-50' : ''}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
      `}
    >
      {/* ── Skeleton ───────────────────────────────────────────────────────────
          Full-bleed — covers the whole card while the image loads.
          Once imgLoaded is true this div is removed, revealing the flag inside
          its padded frame. No layout shift because the card height is already
          determined by `aspect-[3/2]` before the image arrives. */}
      {!imgLoaded && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse" />
      )}

      {/* ── Flag image in padded inner frame ───────────────────────────────────
          WHY a separate inner div with p-2:
            The 8 px gap between the card edge and the flag makes letterboxed
            flags look deliberately "framed" rather than floating in dead space.
            It also prevents flags with thin white borders (Japan, Ireland, …)
            from disappearing into the card edge.

          WHY object-contain (not object-cover):
            object-cover fills the container by cropping — Qatar's serrated band
            gets clipped, Switzerland becomes a cropped rectangle, Nepal is
            unrecognisable. object-contain always shows the full flag at its true
            aspect ratio; the only trade-off is background showing on two sides
            for flags that don't match the 3:2 container (e.g. 1:1 Switzerland
            gets ~28 px on each side, 2:1 flags get ~10 px top/bottom).

          WHY aspect-[3/2] on the card:
            3:2 is the most common flag ratio (France, Germany, Brazil, …) so
            it minimises average letterboxing across the entire country set.
            Compared to the previous 4:3 container, wide flags (2:1) have far
            less wasted space above/below.

          WHY drop-shadow-sm:
            A CSS filter drop-shadow (not box-shadow) follows the image's actual
            rendered shape. It separates the flag from the card background without
            a harsh border, giving a slight "physical object" feel. */}
      <div className="absolute inset-0 p-2">
        {imgError ? (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-mono uppercase tracking-widest">
            {country.code}
          </div>
        ) : (
          <img
            src={getFlagUrl(country.code)}
            alt={isAnswered ? country.name : `Flag option ${index + 1}`}
            className={`
              w-full h-full object-contain drop-shadow-sm
              transition-opacity duration-300
              ${imgLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgError(true)
              setImgLoaded(true)
            }}
            loading="lazy"
          />
        )}
      </div>

      {/* ── Country name label (after answering) ───────────────────────────── */}
      {isAnswered && (
        <div
          className={`
            absolute bottom-0 left-0 right-0 px-2 py-1
            text-xs font-semibold text-white text-center truncate
            ${labelBg}
          `}
        >
          {country.name}
        </div>
      )}

      {/* ── Keyboard shortcut badge (before answering) ─────────────────────── */}
      {!isAnswered && (
        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/50 text-white text-xs font-bold flex items-center justify-center">
          {index + 1}
        </div>
      )}
    </button>
  )
}
