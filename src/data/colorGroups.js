// Bảng gam màu chuẩn — 20 màu đặc trưng dùng trong nhomMau
// code: 2 ký tự, hex: màu đại diện để hiển thị swatch
export const COLOR_GROUPS = [
  { code: 'WH', name_vi: 'Trắng',      name_en: 'White',      hex: '#F7F6F4' },
  { code: 'OW', name_vi: 'Trắng ngà',  name_en: 'Off White',  hex: '#EDE9DE' },
  { code: 'IV', name_vi: 'Ngà',        name_en: 'Ivory',      hex: '#E8E0C5' },
  { code: 'CR', name_vi: 'Kem',        name_en: 'Cream',      hex: '#F2D98B' },
  { code: 'BE', name_vi: 'Be',         name_en: 'Beige',      hex: '#D9C09A' },
  { code: 'SL', name_vi: 'Bạc',        name_en: 'Silver',     hex: '#b0b8c8' },
  { code: 'BR', name_vi: 'Nâu',        name_en: 'Brown',      hex: '#8B6347' },
  { code: 'GR', name_vi: 'Xám',        name_en: 'Grey',       hex: '#A0A0A0' },
  { code: 'BK', name_vi: 'Đen',        name_en: 'Black',      hex: '#2A2A2A' },
  { code: 'NY', name_vi: 'Xanh Navy',  name_en: 'Navy',       hex: '#1a3a6e' },
  { code: 'BL', name_vi: 'Xanh dương', name_en: 'Blue',       hex: '#4A78B8' },
  { code: 'TL', name_vi: 'Xanh ngọc',  name_en: 'Teal',       hex: '#2d8a8a' },
  { code: 'GN', name_vi: 'Xanh lá',   name_en: 'Green',      hex: '#5A8C5A' },
  { code: 'OL', name_vi: 'Xanh Olive', name_en: 'Olive',      hex: '#6b7a2e' },
  { code: 'RD', name_vi: 'Đỏ',        name_en: 'Red',        hex: '#C44444' },
  { code: 'BU', name_vi: 'Đỏ rượu',   name_en: 'Burgundy',   hex: '#7a1a2e' },
  { code: 'OR', name_vi: 'Cam',        name_en: 'Orange',     hex: '#d4681a' },
  { code: 'YL', name_vi: 'Vàng',       name_en: 'Yellow',     hex: '#d4a820' },
  { code: 'PK', name_vi: 'Hồng',      name_en: 'Pink',       hex: '#E08090' },
  { code: 'PU', name_vi: 'Tím',        name_en: 'Purple',     hex: '#7a4a9a' },
]

// Tìm color entry theo code, name_en, hoặc name_vi (case-insensitive)
export function findColorEntry(nhomMau) {
  if (!nhomMau) return null
  const low = nhomMau.trim().toLowerCase()
  return COLOR_GROUPS.find(
    (c) => c.code.toLowerCase() === low ||
           c.name_en.toLowerCase() === low ||
           c.name_vi.toLowerCase() === low
  ) ?? null
}

// Tìm color entry gần nhất theo HEX (RGB Euclidean distance)
// Dùng khi có per-maNCC variant override để hiển thị đúng tên màu mới
export function findClosestColorEntry(hex) {
  if (!hex || hex.length < 7) return null
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  let best = null, minD = Infinity
  for (const c of COLOR_GROUPS) {
    const ch = c.hex.replace('#', '')
    const dr = r - parseInt(ch.slice(0, 2), 16)
    const dg = g - parseInt(ch.slice(2, 4), 16)
    const db = b - parseInt(ch.slice(4, 6), 16)
    const d = dr * dr + dg * dg + db * db
    if (d < minD) { minD = d; best = c }
  }
  return best
}
