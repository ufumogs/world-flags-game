import { useMemo } from 'react'
import rawCountries from '../data/countries.json'
import type { Country, Continent } from '../types'

const countries = rawCountries as Country[]

// Returns the country pool, optionally filtered by continent.
// Thin now — when continent filtering UI ships, config flows through here
// without changing any other code.
export function useCountries(continents: Continent[] | 'all' = 'all'): Country[] {
  return useMemo(() => {
    if (continents === 'all') return countries
    return countries.filter(c => continents.includes(c.continent))
  }, [continents])
}
