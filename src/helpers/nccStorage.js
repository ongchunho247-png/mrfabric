const KEY = 'mrfabric_ncc_list'
const INITIAL = ['Acacia', 'Shinhan']

export function loadNccList() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(KEY, JSON.stringify(INITIAL))
    return [...INITIAL]
  } catch {
    return [...INITIAL]
  }
}

export function addNccToList(existing, name) {
  const trimmed = name.trim()
  if (!trimmed || existing.includes(trimmed)) return existing
  const updated = [...existing, trimmed].sort((a, b) => a.localeCompare(b, 'vi'))
  localStorage.setItem(KEY, JSON.stringify(updated))
  return updated
}
