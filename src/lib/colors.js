export function hslToHex(h, s, l) {
  s /= 100
  l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

const HUES = [150, 42, 28, 355, 280] // grün, gold, orange, rot, violett
const LEVELS = [28, 40, 54, 68, 80] // dunkel/gesättigt -> hell/pastell

export function generatePaletteGrid() {
  return LEVELS.map((l, i) => {
    const sat = i === 0 ? 45 : i < 3 ? 58 : 62
    return [...HUES.map((h) => hslToHex(h, sat, l)), hslToHex(0, 0, l)]
  })
}
