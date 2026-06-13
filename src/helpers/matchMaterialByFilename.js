/**
 * Match material by filename (maNCC)
 * VD: "KC-03.jpg" → tìm material có maNCC = "KC-03"
 * VD: "A15-8_RED.png" → tìm material có maNCC = "A15-8"
 */

export function extractNccCodeFromFilename(filename) {
  if (!filename) return null

  // Loại bỏ extension
  const nameWithoutExt = filename.split('.').slice(0, -1).join('.')

  // Pattern 1: "KC-03" hoặc "KC-03_something"
  // Tìm pattern: chữ cái/số + gạch ngang + số
  const match = nameWithoutExt.match(/^([A-Z0-9]+-[A-Z0-9]+)/i)
  if (match) {
    return match[1].toUpperCase().trim()
  }

  // Pattern 2: Nếu toàn bộ tên là code (VD: "KC03" không gạch)
  const simpleMatch = nameWithoutExt.match(/^[A-Z0-9]{2,10}$/i)
  if (simpleMatch && nameWithoutExt.length <= 10) {
    return nameWithoutExt.toUpperCase().trim()
  }

  return null
}

/**
 * Tìm sản phẩm trong kho dựa trên maNCC từ tên file ảnh
 * @param {string} filename - Tên file ảnh (VD: "KC-03.jpg")
 * @param {array} materials - Danh sách tất cả vật liệu
 * @returns {object|null} Material nếu tìm thấy, null nếu không
 */
export function findMaterialByFilename(filename, materials) {
  const nccCode = extractNccCodeFromFilename(filename)
  if (!nccCode) return null

  const found = materials.find((m) => m.maNCC && m.maNCC.toUpperCase() === nccCode)
  return found || null
}

/**
 * Tìm multiple matches (nếu có nhiều material cùng maNCC)
 * @param {string} filename
 * @param {array} materials
 * @returns {array} Danh sách materials match
 */
export function findMaterialsByFilename(filename, materials) {
  const nccCode = extractNccCodeFromFilename(filename)
  if (!nccCode) return []

  return materials.filter((m) => m.maNCC && m.maNCC.toUpperCase() === nccCode)
}
