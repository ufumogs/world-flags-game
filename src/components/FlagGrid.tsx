import type { Country } from '../types'
import { FlagOption } from './FlagOption'

interface FlagGridProps {
  options: Country[]
  correctCode: string
  selectedCode: string | null
  onSelect: (code: string) => void
}

export function FlagGrid({ options, correctCode, selectedCode, onSelect }: FlagGridProps) {
  const isAnswered = selectedCode !== null

  return (
    <div className="grid grid-cols-2 gap-3" role="group" aria-label="Flag options">
      {options.map((country, i) => (
        <FlagOption
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
