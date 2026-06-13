import { COLOR_GROUPS, findColorEntry } from '../data/colorGroups'

export function filterMaterials(materials, { search, filters }) {
  let result = [...materials]

  // Search
  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    result = result.filter((m) => {
      const fields = [
        m.maMrFabric,
        m.maNCC,
        m.collection,
        m.nhaCungCap,
        m.nhomMau,
        m.toneMau,
        ...(Array.isArray(m.beMat) ? m.beMat : [m.beMat]),
        m.phanKhuc,
        ...(Array.isArray(m.ungDung) ? m.ungDung : []),
        ...(Array.isArray(m.congNang) ? m.congNang : []),
        ...(Array.isArray(m.phongCach) ? m.phongCach : []),
        ...(Array.isArray(m.tieuChuan) ? m.tieuChuan : [m.tieuChuan]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return fields.includes(q)
    })
  }

  // Price range filter (special _priceMin/_priceMax — not checkbox groups)
  const toNum = (val) => parseInt(String(val || '').replace(/\D/g, ''), 10) || 0
  const rawMin = filters._priceMin ? toNum(filters._priceMin) : 0
  const rawMax = filters._priceMax ? toNum(filters._priceMax) : 0
  if (rawMin > 0 || rawMax > 0) {
    result = result.filter((m) => {
      const price = toNum(m.giaBan)
      if (rawMin > 0 && price < rawMin) return false
      if (rawMax > 0 && price > rawMax) return false
      return true
    })
  }

  // Checkbox filters – same group = OR, different groups = AND
  // Exclude _price* special keys (strings, not arrays)
  const activeGroups = Object.entries(filters).filter(
    ([key, vals]) => !key.startsWith('_') && vals && vals.length > 0,
  )

  for (const [key, vals] of activeGroups) {
    result = result.filter((m) => {
      if (key === 'nhomMau') {
        const entry = findColorEntry(m.nhomMau)
        const colorName = entry ? entry.name_en : (m.nhomMau || '')
        return vals.includes(colorName)
      }
      const fieldValue = m[key]
      if (Array.isArray(fieldValue)) {
        return vals.some((v) => fieldValue.includes(v))
      }
      return vals.includes(fieldValue)
    })
  }

  return result
}
