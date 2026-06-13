/**
 * Import helpers - Sync dữ liệu từ CLI với app localStorage
 * Dùng bởi: batchImport.js, AdminPage.jsx
 */

const KEY = 'mrfabric_admin_materials'

/**
 * Sync imported data từ JSON file vào localStorage
 * @param {array} importedData - Kết quả từ batchImport.js
 * @returns {object} { success: boolean, message: string, count: number }
 */
export function syncImportedData(importedData) {
  try {
    if (!Array.isArray(importedData)) {
      return { success: false, message: 'Invalid data format' }
    }

    // Load existing data
    let existing = []
    try {
      const raw = localStorage?.getItem(KEY)
      existing = raw ? JSON.parse(raw) : []
    } catch (e) {
      // localStorage not available (Node.js context)
      existing = []
    }

    // Filter out duplicates & add new items
    const newItems = importedData.filter(
      (item) => !existing.some((e) => e.maNCC === item.maNCC && e.nhaCungCap === item.nhaCungCap)
    )

    if (newItems.length === 0) {
      return { success: false, message: 'Tất cả sản phẩm đã tồn tại', count: 0 }
    }

    // Assign IDs & timestamps
    const maxId = Math.max(...existing.map((e) => e.id || 0), 0)
    const itemsToAdd = newItems.map((item, idx) => ({
      ...item,
      id: maxId + idx + 1,
      createdAt: new Date().toISOString(),
      trangThai: 'active',
    }))

    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      const updated = [...existing, ...itemsToAdd]
      localStorage.setItem(KEY, JSON.stringify(updated))
    }

    return {
      success: true,
      message: `Đã import thành công ${itemsToAdd.length} sản phẩm`,
      count: itemsToAdd.length,
      items: itemsToAdd,
    }
  } catch (err) {
    return { success: false, message: `Lỗi: ${err.message}` }
  }
}

/**
 * Export current library để backup hoặc share
 * @returns {object} Library data
 */
export function exportLibrary() {
  try {
    const raw = localStorage?.getItem(KEY)
    const data = raw ? JSON.parse(raw) : []
    return {
      timestamp: new Date().toISOString(),
      count: data.length,
      materials: data,
    }
  } catch (err) {
    return { success: false, message: `Lỗi: ${err.message}` }
  }
}

/**
 * Import từ exported library file
 * @param {object} data - Exported library object
 * @returns {object} Result status
 */
export function importFromExportedFile(data) {
  if (!data?.materials || !Array.isArray(data.materials)) {
    return { success: false, message: 'Invalid export file format' }
  }
  return syncImportedData(data.materials)
}
