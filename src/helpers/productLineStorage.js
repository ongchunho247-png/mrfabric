const KEY = 'mrfabric_product_lines'
const OLD_CUSTOM_KEY = 'mrfabric_custom_product_lines'

const DEFAULT_LINES = [
  { id: 'linen-look-dimout', typeCode: 'LLD', name: 'MrFabric Linen Look Dimout', shortName: 'Linen Look Dimout', status: 'active' },
  { id: 'sheer-linen-look', typeCode: 'SLL', name: 'MrFabric Sheer Linen Look', shortName: 'Sheer Linen Look', status: 'active' },
]

export function loadProductLines() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw !== null) return JSON.parse(raw)
    // First run — migrate old custom product lines if any
    const oldRaw = localStorage.getItem(OLD_CUSTOM_KEY)
    const oldCustom = oldRaw ? JSON.parse(oldRaw) : []
    const lines = [...DEFAULT_LINES, ...oldCustom]
    saveProductLines(lines)
    return lines
  } catch {
    return [...DEFAULT_LINES]
  }
}

export function saveProductLines(lines) {
  localStorage.setItem(KEY, JSON.stringify(lines))
}

export function addProductLine(lines, shortName, typeCode) {
  const code = typeCode.trim().toUpperCase().replace(/[^A-Z]/g, '')
  const name = shortName.trim()
  if (!code || !name) return lines
  if (lines.some((l) => l.typeCode === code)) return lines
  return [
    ...lines,
    {
      id: `custom-${code.toLowerCase()}-${Date.now()}`,
      typeCode: code,
      name,
      shortName: name,
      status: 'active',
    },
  ]
}

export function removeProductLine(lines, id) {
  return lines.filter((l) => l.id !== id)
}
