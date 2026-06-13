// Quản lý hiển thị/ẩn vật liệu và nhóm vật liệu

const HIDDEN_ITEMS_KEY = 'mrfabric_hidden_items'
const HIDDEN_GROUPS_KEY = 'mrfabric_hidden_groups'
const HIDDEN_NCCS_KEY = 'mrfabric_hidden_nccs'

// ── Hidden individual materials ─────────────────────────────────────────────

export function loadHiddenItems() {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_ITEMS_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveHiddenItems(items) {
  localStorage.setItem(HIDDEN_ITEMS_KEY, JSON.stringify(items))
}

export function toggleHideMaterial(maMrFabricOrId) {
  const items = loadHiddenItems()
  const key = (maMrFabricOrId || '').trim()
  if (!key) return items
  const idx = items.indexOf(key)
  if (idx >= 0) {
    items.splice(idx, 1)
  } else {
    items.push(key)
  }
  saveHiddenItems(items)
  return items
}

export function isMaterialHidden(maMrFabricOrId) {
  const items = loadHiddenItems()
  const key = (maMrFabricOrId || '').trim()
  return items.includes(key)
}

// ── Hidden material groups (nhomVatLieu) ────────────────────────────────────

export function loadHiddenGroups() {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_GROUPS_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveHiddenGroups(groups) {
  localStorage.setItem(HIDDEN_GROUPS_KEY, JSON.stringify(groups))
}

export function toggleHideGroup(nhomVatLieu) {
  const groups = loadHiddenGroups()
  const key = (nhomVatLieu || '').trim()
  if (!key) return groups
  const idx = groups.indexOf(key)
  if (idx >= 0) {
    groups.splice(idx, 1)
  } else {
    groups.push(key)
  }
  saveHiddenGroups(groups)
  return groups
}

export function isGroupHidden(nhomVatLieu) {
  const groups = loadHiddenGroups()
  const key = (nhomVatLieu || '').trim()
  return groups.includes(key)
}

// ── Hidden collections (tenCuon / collection) ──────────────────────────────

const HIDDEN_COLLECTIONS_KEY = 'mrfabric_hidden_collections'

export function loadHiddenCollections() {
  try { return JSON.parse(localStorage.getItem(HIDDEN_COLLECTIONS_KEY) || '[]') }
  catch { return [] }
}

export function saveHiddenCollections(cols) {
  localStorage.setItem(HIDDEN_COLLECTIONS_KEY, JSON.stringify(cols))
}

export function toggleHideCollection(collection) {
  const cols = loadHiddenCollections()
  const key = (collection || '').trim()
  if (!key) return cols
  const idx = cols.indexOf(key)
  if (idx >= 0) cols.splice(idx, 1)
  else cols.push(key)
  saveHiddenCollections(cols)
  return cols
}

export function isCollectionHidden(collection) {
  const cols = loadHiddenCollections()
  return cols.includes((collection || '').trim())
}

// ── Hidden NCCs (nhaCungCap) ────────────────────────────────────────────────

export function loadHiddenNccs() {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_NCCS_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveHiddenNccs(nccs) {
  localStorage.setItem(HIDDEN_NCCS_KEY, JSON.stringify(nccs))
}

export function toggleHideNcc(nhaCungCap) {
  const nccs = loadHiddenNccs()
  const key = (nhaCungCap || '').trim()
  if (!key) return nccs
  const idx = nccs.indexOf(key)
  if (idx >= 0) {
    nccs.splice(idx, 1)
  } else {
    nccs.push(key)
  }
  saveHiddenNccs(nccs)
  return nccs
}

export function isNccHidden(nhaCungCap) {
  const nccs = loadHiddenNccs()
  const key = (nhaCungCap || '').trim()
  return nccs.includes(key)
}

// ── Filter materials by visibility ─────────────────────────────────────────

export function filterByVisibility(materials) {
  const hiddenItems = loadHiddenItems()
  const hiddenGroups = loadHiddenGroups()
  const hiddenNccs = loadHiddenNccs()
  const hiddenCollections = loadHiddenCollections()
  const hiddenItemsSet = new Set(hiddenItems.map((x) => (x || '').trim().toLowerCase()))
  const hiddenGroupsSet = new Set(hiddenGroups.map((x) => (x || '').trim()))
  const hiddenNccsSet = new Set(hiddenNccs.map((x) => (x || '').trim()))
  const hiddenCollectionsSet = new Set(hiddenCollections.map((x) => (x || '').trim()))

  return materials.filter((m) => {
    if (m.nhaCungCap && hiddenNccsSet.has(m.nhaCungCap.trim())) return false
    if (m.collection && hiddenCollectionsSet.has(m.collection.trim())) return false
    if (hiddenItemsSet.has((m.maMrFabric || '').trim().toLowerCase())) return false
    if (hiddenItemsSet.has((m.id || '').trim())) return false
    if (m.nhomVatLieu && hiddenGroupsSet.has(m.nhomVatLieu.trim())) return false
    return true
  })
}
