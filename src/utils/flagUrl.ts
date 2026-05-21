const BASE = 'https://flagcdn.com'

// Single point of change if the CDN ever changes.
// w320 is sharp on 2x displays while keeping bandwidth reasonable (~15-40KB per flag).
export function getFlagUrl(code: string, width: 160 | 320 | 640 = 320): string {
  return `${BASE}/w${width}/${code.toLowerCase()}.png`
}
