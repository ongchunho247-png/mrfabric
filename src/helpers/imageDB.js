// IndexedDB wrapper — lưu ảnh kích thước lớn (surface_reference, full-res slots)
// Không bị giới hạn 5MB như localStorage, hỗ trợ vài trăm MB đến GB

const DB_NAME = 'mrfabric_images'
const DB_VERSION = 1
const STORE = 'images'

let _db = null

function openDB() {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE)
    req.onsuccess  = (e) => { _db = e.target.result; resolve(_db) }
    req.onerror    = (e) => reject(e.target.error)
  })
}

export async function idbSave(key, dataUrl) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(dataUrl, key)
    tx.oncomplete = () => resolve()
    tx.onerror    = (e) => reject(e.target.error)
  })
}

export async function idbGet(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = (e) => resolve(e.target.result || null)
    req.onerror   = (e) => reject(e.target.error)
  })
}

export async function idbDelete(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror    = (e) => reject(e.target.error)
  })
}

export async function idbHas(key) {
  const val = await idbGet(key)
  return val !== null
}

// Key chuẩn cho surface reference của 1 mã
export function surfaceRefKey(maMrFabric) {
  return `surf_ref::${maMrFabric}`
}
