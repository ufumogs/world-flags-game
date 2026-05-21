import type { Country } from '../types'
import { NameOption } from './NameOption'

interface NameGridProps {
  options: Country[]
  correctCode: string
  selectedCode: string | null
  onSelect: (code: string) => void
}

// Single-column stacked list of country name options.
// Uses a 1-col layout (vs FlagGrid's 2-col) because country names are long text —
// a 2-col layout would either truncate names or produce inconsistent row heights.
export function NameGrid({ options, correctCode, selectedCode, onSelect }: NameGridProps) {
  const isAnswered = selectedCode !== null

  return (
    <div className="flex flex-col gap-2.5" role="group" aria-label="Country name options">
      {options.map((country, i) => (
        <NameOption
          key={country.code}
          country={country}
          index={i}
          isSelected={selectedCode === country.code}
          isCorrect={correctCode === country.code}
          isAnswered={isAnswered}
          onSelect={() => onSelect(country.code)}
        />
      ))}
    </div>
  )
}
