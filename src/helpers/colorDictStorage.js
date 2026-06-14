import { COLOR_GROUPS, findColorEntry } from '../data/colorGroups'

const KEY         = 'mrfabric_color_dict'     // nhomMau overrides (per color group)
const VARIANT_KEY = 'mrfabric_color_variant'  // per-maNCC overrides (highest priority)

// ── nhomMau dictionary ────────────────────────────────────────────────────────

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function saveColorHex(code, hex) {
  const o = loadOverrides(); o[code] = hex
  localStorage.setItem(KEY, JSON.stringify(o))
}

export function resetColorHex(code) {
  const o = loadOverrides(); delete o[code]
  localStorage.setItem(KEY, JSON.stringify(o))
}

// HEX cho nhomMau — ưu tiên override, fallback về colorGroups.js
export function getColorHex(nhomMau) {
  if (!nhomMau) return null
  const entry = findColorEntry(nhomMau)
  if (!entry) return null
  return loadOverrides()[entry.code] || entry.hex
}

// Toàn bộ bảng màu 20 nhóm kèm trạng thái override
export function getAllColors() {
  const overrides = loadOverrides()
  return COLOR_GROUPS.map((c) => ({
    ...c,
    hex: overrides[c.code] || c.hex,
    isOverridden: !!overrides[c.code],
    defaultHex: c.hex,
  }))
}

// ── Per-maNCC variant overrides ───────────────────────────────────────────────

function loadVariants() {
  try { return JSON.parse(localStorage.getItem(VARIANT_KEY) || '{}') } catch { return {} }
}

export function saveVariantHex(maNCC, hex) {
  const v = loadVariants(); v[maNCC] = hex
  localStorage.setItem(VARIANT_KEY, JSON.stringify(v))
}

export function resetVariantHex(maNCC) {
  const v = loadVariants(); delete v[maNCC]
  localStorage.setItem(VARIANT_KEY, JSON.stringify(v))
}

export function getVariantHex(maNCC) {
  if (!maNCC) return null
  return loadVariants()[maNCC] || null
}

// ── Hàm chính — ưu tiên: per-maNCC → nhomMau dict → null ────────────────────
export function getEffectiveHex(maNCC, nhomMau) {
  return getVariantHex(maNCC) || getColorHex(nhomMau) || null
}
