const KEY = 'mrfabric_custom_colors'

const DEFAULT_COLORS = [
  { code: 'TRG', name_vi: 'Trắng' },
  { code: 'KEM', name_vi: 'Kem' },
  { code: 'BE',  name_vi: 'Beige' },
  { code: 'XS',  name_vi: 'Xám sáng' },
  { code: 'XT',  name_vi: 'Xám tối' },
  { code: 'DEN', name_vi: 'Đen' },
  { code: 'NU',  name_vi: 'Nâu' },
  { code: 'CAM', name_vi: 'Cam' },
  { code: 'DO',  name_vi: 'Đỏ' },
  { code: 'XL',  name_vi: 'Xanh lá' },
  { code: 'XD',  name_vi: 'Xanh dương' },
  { code: 'TIM', name_vi: 'Tím' },
  { code: 'HON', name_vi: 'Hồng' },
  { code: 'VG',  name_vi: 'Vàng gold' },
]

// Format: [{ code: 'BG', name_vi: 'Nâu' }, ...]
export function loadCustomColors() {
  const raw = localStorage.getItem(KEY)
  if (raw === null) return DEFAULT_COLORS  // first run — use defaults
  try { return JSON.parse(raw) }
  catch { return DEFAULT_COLORS }
}

export function saveCustomColors(colors) {
  localStorage.setItem(KEY, JSON.stringify(colors))
}

export function addCustomColor(colors, code, name_vi) {
  const c = code.trim().toUpperCase()
  if (!c || colors.some((x) => x.code === c)) return colors
  return [...colors, { code: c, name_vi: name_vi.trim() }]
}

export function removeCustomColor(colors, code) {
  return colors.filter((c) => c.code !== code)
}
