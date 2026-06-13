const KEY = 'mrfabric_moodboard'

export function loadMoodboard() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveMoodboard(items) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function addToMoodboard(items, material) {
  const exists = items.some((i) => i.maMrFabric === material.maMrFabric)
  if (exists) return items
  const newItem = { ...material, moodboardStatus: 'Đề xuất chính' }
  const updated = [...items, newItem]
  saveMoodboard(updated)
  return updated
}

export function removeFromMoodboard(items, maMrFabric) {
  const updated = items.filter((i) => i.maMrFabric !== maMrFabric)
  saveMoodboard(updated)
  return updated
}

export function updateMoodboardStatus(items, maMrFabric, status) {
  const updated = items.map((i) =>
    i.maMrFabric === maMrFabric ? { ...i, moodboardStatus: status } : i,
  )
  saveMoodboard(updated)
  return updated
}

export function clearMoodboard() {
  saveMoodboard([])
  return []
}
