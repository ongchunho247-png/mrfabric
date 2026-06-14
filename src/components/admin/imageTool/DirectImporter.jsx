import { useState, useCallback } from 'react'
import {
  extractNccCode,
  detectImageType,
  matchNccInPriceTable,
  loadImageAsDataUrl,
  processMasterImage,
  SLOT_KEYS,
  BATCH_STATUS,
  STATUS_LABEL,
} from '../../../helpers/fabricImageHelpers'

// ── Helpers ───────────────────────────────────────────────────────────────────

const S = { PENDING: 'pending', PROCESSING: 'processing', DONE: 'done', ERROR: 'error' }

const TYPE_LABEL = {
  single: 'Bề mặt (slot 1)',
  master: 'Master 3×2 → 6 slot',
  slot_1: 'Slot 1 — Bề mặt',
  slot_2: 'Slot 2 — Cận chất liệu',
  slot_3: 'Slot 3 — Cầm nắm',
  slot_4: 'Slot 4 — Thành phẩm ~1m',
  slot_5: 'Slot 5 — Nội thất ~2m',
  slot_6: 'Slot 6 — Kỹ thuật',
}

function fieldForType(type) {
  if (type === 'master') return null
  if (type === 'single' || type === 'slot_1') return 'surface_texture'
  const sk = SLOT_KEYS.find((s) => s.slot === type)
  return sk?.field || null
}

function createEntry(file, priceTable) {
  const ncc   = extractNccCode(file.name) || ''
  const type  = detectImageType(file.name)
  const match = ncc
    ? matchNccInPriceTable(ncc, priceTable)
    : { type: BATCH_STATUS.INVALID, matches: [] }
  return {
    id:         `${file.name}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    previewUrl: URL.createObjectURL(file),
    ncc,
    type,
    match,
    status:     S.PENDING,
    result:     null,
    error:      null,
  }
}

async function processEntry(entry) {
  const { file, type } = entry
  if (type === 'master') {
    return await processMasterImage(file)
  }
  const field = fieldForType(type)
  if (!field) throw new Error(`Loại ảnh không hỗ trợ: ${type}`)
  const url = await loadImageAsDataUrl(file, 1400)
  return { [field]: url }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SlotThumbs({ result }) {
  if (!result) return null
  const filled = SLOT_KEYS.filter((sk) => result[sk.field])
  if (!filled.length) return null
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {filled.map((sk) => (
        <img
          key={sk.slot}
          src={result[sk.field]}
          alt={sk.label}
          title={sk.label}
          style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--color-border)' }}
        />
      ))}
    </div>
  )
}

function MatchBadge({ match }) {
  const { type } = match
  if (type === BATCH_STATUS.FOUND) return <span className="fit-badge fit-badge--found">✓ Tìm thấy</span>
  if (type === BATCH_STATUS.NOT_FOUND) return <span className="fit-badge fit-badge--not_found">Không thấy</span>
  if (type === BATCH_STATUS.MULTIPLE)  return <span className="fit-badge fit-badge--multiple">Nhiều kết quả</span>
  if (type === BATCH_STATUS.PARTIAL)   return <span className="fit-badge fit-badge--partial">Gần đúng</span>
  return <span className="fit-badge fit-badge--invalid">{STATUS_LABEL[type] || type}</span>
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DirectImporter({ priceTable = [], onSaveImages }) {
  const [entries, setEntries] = useState([])
  const [running, setRunning] = useState(false)
  const [isDrag, setIsDrag]   = useState(false)

  // ── File ingestion ─────────────────────────────────────────────────────────

  function addFiles(fileList) {
    const arr = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    if (!arr.length) return
    setEntries((prev) => [...prev, ...arr.map((f) => createEntry(f, priceTable))])
  }

  function removeEntry(id) {
    setEntries((prev) => {
      const entry = prev.find((e) => e.id === id)
      if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl)
      return prev.filter((e) => e.id !== id)
    })
  }

  function clearAll() {
    setEntries((prev) => {
      prev.forEach((e) => { if (e.previewUrl) URL.revokeObjectURL(e.previewUrl) })
      return []
    })
  }

  // ── Processing ─────────────────────────────────────────────────────────────

  async function handleProcessAll() {
    if (running) return
    const pending = entries.filter((e) => e.status === S.PENDING)
    if (!pending.length) return
    setRunning(true)
    for (const entry of pending) {
      setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: S.PROCESSING } : e))
      try {
        const result = await processEntry(entry)
        const maNCC  = entry.match.type === BATCH_STATUS.FOUND
          ? entry.match.matches[0].maNCC
          : entry.ncc
        if (maNCC && onSaveImages) onSaveImages(maNCC, result)
        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: S.DONE, result } : e))
      } catch (err) {
        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: S.ERROR, error: err.message } : e))
      }
    }
    setRunning(false)
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const onDragOver  = useCallback((e) => { e.preventDefault(); setIsDrag(true)  }, [])
  const onDragLeave = useCallback(() => setIsDrag(false), [])
  const onDrop      = useCallback((e) => {
    e.preventDefault()
    setIsDrag(false)
    addFiles(e.dataTransfer.files)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceTable])

  // ── Counts ─────────────────────────────────────────────────────────────────

  const pendingCount    = entries.filter((e) => e.status === S.PENDING).length
  const processingCount = entries.filter((e) => e.status === S.PROCESSING).length
  const doneCount       = entries.filter((e) => e.status === S.DONE).length
  const errorCount      = entries.filter((e) => e.status === S.ERROR).length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fit-di">

      {/* Intro */}
      <div className="fit-di-intro">
        <span>Kéo thả ảnh đã hoàn chỉnh vào đây để import thẳng vào thư viện, bỏ qua AI.</span>
        <span className="fit-di-intro-conventions">
          <code>mãNCC_1.jpg</code> → ô 1 (Bề mặt) &nbsp;·&nbsp;
          <code>mãNCC_2.jpg</code> → ô 2 (Cận) &nbsp;·&nbsp;
          <code>mãNCC_3.jpg</code> → ô 3 (Cầm) &nbsp;·&nbsp;
          <code>mãNCC_4.jpg</code> → ô 4 &nbsp;·&nbsp;
          <code>mãNCC_5.jpg</code> → ô 5 &nbsp;·&nbsp;
          <code>mãNCC_6.jpg</code> → ô 6 &nbsp;·&nbsp;
          <code>mãNCC_master.jpg</code> → tách 3×2 → 6 ô
        </span>
      </div>

      {/* Drop zone */}
      <div
        className={`fit-upload-zone${isDrag ? ' fit-upload-zone--drag' : ''}`}
        style={{ padding: '18px 20px' }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="fit-upload-icon">📥</div>
        <div className="fit-upload-label">Kéo thả nhiều ảnh vào đây hoặc click để chọn</div>
        <div className="fit-upload-hint">Hỗ trợ JPG · PNG · WebP — nhiều file cùng lúc</div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
        />
      </div>

      {/* File list */}
      {entries.length > 0 && (
        <>
          {/* Action bar */}
          <div className="fit-batch-bar">
            <span className="fit-batch-count">
              {entries.length} file
              {pendingCount > 0    && <> · <strong>{pendingCount}</strong> chờ</>}
              {processingCount > 0 && <> · <strong>{processingCount}</strong> đang xử lý</>}
              {doneCount > 0       && <> · <strong style={{ color: 'var(--color-success)' }}>{doneCount}</strong> đã lưu</>}
              {errorCount > 0      && <> · <strong style={{ color: 'var(--color-danger)' }}>{errorCount}</strong> lỗi</>}
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleProcessAll}
              disabled={running || !pendingCount}
            >
              {running ? 'Đang xử lý…' : `Xử lý & Lưu (${pendingCount})`}
            </button>
            {!running && (
              <button className="btn btn-secondary btn-sm" onClick={clearAll}>
                Xoá tất cả
              </button>
            )}
          </div>

          {/* Table */}
          <div className="fit-batch-table-wrap">
            <table className="fit-batch-table">
              <thead>
                <tr>
                  <th>Ảnh / Kết quả</th>
                  <th>Tên file</th>
                  <th>Mã NCC</th>
                  <th>Loại</th>
                  <th>Bảng đơn giá</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>

                    {/* Thumbnail → kết quả sau khi xong */}
                    <td>
                      {entry.status === S.DONE && entry.result
                        ? <SlotThumbs result={entry.result} />
                        : <img src={entry.previewUrl} alt="" className="fit-batch-thumb" />
                      }
                    </td>

                    {/* Filename */}
                    <td>
                      <span className="fit-batch-filename" title={entry.file.name}>
                        {entry.file.name}
                      </span>
                    </td>

                    {/* NCC */}
                    <td>
                      {entry.ncc
                        ? <span className="fit-batch-ncc">{entry.ncc}</span>
                        : <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>—</span>
                      }
                    </td>

                    {/* Loại */}
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text)' }}>
                        {TYPE_LABEL[entry.type] || entry.type}
                      </span>
                    </td>

                    {/* Match */}
                    <td><MatchBadge match={entry.match} /></td>

                    {/* Status */}
                    <td>
                      {entry.status === S.PENDING    && <span className="fit-badge fit-badge--pending">Chờ</span>}
                      {entry.status === S.PROCESSING && <span className="fit-badge fit-badge--processing">Đang xử lý…</span>}
                      {entry.status === S.DONE       && <span className="fit-badge fit-badge--done">✓ Đã lưu</span>}
                      {entry.status === S.ERROR      && (
                        <span className="fit-badge fit-badge--error" title={entry.error}>Lỗi</span>
                      )}
                    </td>

                    {/* Remove */}
                    <td>
                      {entry.status !== S.PROCESSING && (
                        <button
                          className="fit-reset-btn"
                          onClick={() => removeEntry(entry.id)}
                          title="Xoá khỏi danh sách"
                        >✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
