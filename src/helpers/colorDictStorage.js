import { COLOR_GROUPS, findColorEntry } from '../data/colorGroups'

const KEY = 'mrfabric_color_dict'

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export function saveColorHex(code, hex) {
  const overrides = loadOverrides()
  overrides[code] = hex
  localStorage.setItem(KEY, JSON.stringify(overrides))
}

export function resetColorHex(code) {
  const overrides = loadOverrides()
  delete overrides[code]
  localStorage.setItem(KEY, JSON.stringify(overrides))
}

// Trả về HEX cho nhomMau — ưu tiên override, fallback về default colorGroups.js
export function getColorHex(nhomMau) {
  if (!nhomMau) return null
  const entry = findColorEntry(nhomMau)
  if (!entry) return null
  const overrides = loadOverrides()
  return overrides[entry.code] || entry.hex
}

// Trả về toàn bộ bảng màu (20 màu) kèm trạng thái override
export function getAllColors() {
  const overrides = loadOverrides()
  return COLOR_GROUPS.map((c) => ({
    ...c,
    hex: overrides[c.code] || c.hex,
    isOverridden: !!overrides[c.code],
    defaultHex: c.hex,
  }))
}
