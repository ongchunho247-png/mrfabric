const KEY = 'mrfabric_admin_materials'

export function loadAdminMaterials() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveAdminMaterial(existing, newMaterial) {
  const isDuplicate = existing.some((m) => m.maMrFabric === newMaterial.maMrFabric)
  if (isDuplicate) return { success: false, reason: 'duplicate', items: existing }
  const updated = [...existing, newMaterial]
  localStorage.setItem(KEY, JSON.stringify(updated))
  return { success: true, items: updated }
}

export function updateAdminMaterial(existing, updatedMaterial) {
  const updated = existing.map((m) => (m.id === updatedMaterial.id ? updatedMaterial : m))
  localStorage.setItem(KEY, JSON.stringify(updated))
  return updated
}

export function addAdminMaterial(existing, material) {
  const updated = [...existing, material]
  localStorage.setItem(KEY, JSON.stringify(updated))
  return updated
}

export function deleteAdminMaterial(existing, id) {
  const updated = existing.filter((m) => m.id !== id)
  localStorage.setItem(KEY, JSON.stringify(updated))
  return updated
}

export function clearAdminMaterials() {
  localStorage.setItem(KEY, '[]')
}

export function getAllMaterials(initialMaterials) {
  const admin = loadAdminMaterials()
  return [...initialMaterials, ...admin]
}
