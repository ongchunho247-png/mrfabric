const KEY = 'mrfabric_ncc_codes'

// Format: { 'Acacia': { code: 'SGN', province: 'SGN', cuonMau: [{ id, ten, maNCC, catalogue, trang }] } }
// code     = mã nội bộ duy nhất, dùng tạo mã MrFabric
// province = mã tỉnh IATA (tuỳ chọn, tham chiếu nội bộ)
// cuonMau  = danh sách cuốn mẫu, mỗi entry là object { id, ten, maNCC, catalogue, trang }
//            (backward compat: cũ có thể là string[], tự normalize)

export function loadNccCodes() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') }
  catch { return {} }
}

export function saveNccCodes(codes) {
  localStorage.setItem(KEY, JSON.stringify(codes))
}

export function setNccEntry(codes, nccName, internalCode, province) {
  const existing = codes[nccName] || {}
  const existingCuon = Array.isArray(existing.cuonMau) ? existing.cuonMau : []
  return {
    ...codes,
    [nccName]: {
      code: internalCode.toUpperCase(),
      province: (province || '').toUpperCase(),
      cuonMau: existingCuon,
    },
  }
}

export function removeNccCode(codes, nccName) {
  const next = { ...codes }
  delete next[nccName]
  return next
}

// Lấy mã nội bộ của NCC (hỗ trợ format cũ là string)
export function getNccCode(codes, nccName) {
  const entry = codes?.[nccName]
  if (!entry) return null
  if (typeof entry === 'string') return entry
  return entry.code || null
}

// Lấy danh sách cuốn mẫu dạng object[], normalize string → object
export function getCuonMauEntries(codes, nccName) {
  const entry = codes?.[nccName]
  if (!entry || typeof entry === 'string') return []
  const list = Array.isArray(entry.cuonMau) ? entry.cuonMau : []
  return list.map((c) =>
    typeof c === 'string'
      ? { id: c, ten: c, maNCC: '', catalogue: '', trang: '' }
      : c,
  )
}

// Lấy danh sách tên cuốn mẫu (string[]) — dùng cho dropdown trong form nhập liệu
export function getCuonMauList(codes, nccName) {
  return getCuonMauEntries(codes, nccName).map((c) => c.ten).filter(Boolean)
}

// Thêm cuốn mẫu mới (object)
export function addCuonMauEntry(codes, nccName, fields) {
  const nccEntry = codes[nccName]
  if (!nccEntry) return codes
  const list = getCuonMauEntries(codes, nccName)
  const newItem = { id: `cm-${Date.now()}`, ten: '', maNCC: '', catalogue: '', trang: '', ...fields }
  return { ...codes, [nccName]: { ...nccEntry, cuonMau: [...list, newItem] } }
}

// Cập nhật một cuốn mẫu theo id
export function updateCuonMauEntry(codes, nccName, updatedEntry) {
  const nccEntry = codes[nccName]
  if (!nccEntry) return codes
  const list = getCuonMauEntries(codes, nccName)
  return {
    ...codes,
    [nccName]: {
      ...nccEntry,
      cuonMau: list.map((c) => (c.id === updatedEntry.id ? { ...c, ...updatedEntry } : c)),
    },
  }
}

// Xóa cuốn mẫu theo id
export function removeCuonMauEntry(codes, nccName, id) {
  const nccEntry = codes[nccName]
  if (!nccEntry) return codes
  const list = getCuonMauEntries(codes, nccName)
  return { ...codes, [nccName]: { ...nccEntry, cuonMau: list.filter((c) => c.id !== id) } }
}
