const KEY = 'mrfabric_price_table'

// Format: [{ id, nhaCungCap, catalogue, tenCuon, maNCC, soTrang, giaMua, dongSanPham }]

export function loadPriceTable() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function savePriceTable(entries) {
  localStorage.setItem(KEY, JSON.stringify(entries))
}

export function addPriceEntry(table, entry) {
  const id = `pt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  return [...table, { id, nhaCungCap: '', catalogue: '', tenCuon: '', maNCC: '', soTrang: '', giaMua: '', dongSanPham: '', hidden: false, ...entry }]
}

export function removePriceEntry(table, id) {
  return table.filter((e) => e.id !== id)
}

export function updatePriceEntry(table, id, fields) {
  return table.map((e) => (e.id === id ? { ...e, ...fields } : e))
}

// Returns full matching entry (includes soTrang, giaMua, etc.) or null
export function lookupEntry(table, maNCC) {
  if (!maNCC) return null
  const key = maNCC.trim().toLowerCase()
  return table.find((e) => (e.maNCC || '').trim().toLowerCase() === key) || null
}

// Returns giaMua string if maNCC matches, null otherwise
export function lookupGiaMua(table, maNCC) {
  return lookupEntry(table, maNCC)?.giaMua || null
}
