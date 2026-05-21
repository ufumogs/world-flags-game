import type { Country } from '../types'

const COUNTRY_ALIASES: Record<string, readonly string[]> = {
  ae: ['uae', 'united arab emirates'],
  gb: ['uk', 'united kingdom', 'great britain', 'britain'],
  us: ['usa', 'us', 'america', 'united states', 'united states of america'],
  va: ['vatican', 'vatican city', 'holy see'],
}

export function normalizeCountryAnswer(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\bthe\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getAcceptedCountryAnswers(country: Country): string[] {
  const answers = [country.name, ...(COUNTRY_ALIASES[country.code] ?? [])]
  return [...new Set(answers.map(normalizeCountryAnswer))]
}

export function findCountryMatch(
  guess: string,
  countries: Country[],
  solvedCodes: ReadonlySet<string>
): Country | null {
  const normalizedGuess = normalizeCountryAnswer(guess)
  if (!normalizedGuess) return null

  return countries.find(country =>
    !solvedCodes.has(country.code) &&
    getAcceptedCountryAnswers(country).includes(normalizedGuess)
  ) ?? null
}
