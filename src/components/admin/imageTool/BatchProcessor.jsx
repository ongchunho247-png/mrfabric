import { useState, useCallback, useRef } from 'react'
import {
  extractNccCode,
  detectImageType,
  matchNccInPriceTable,
  loadImageAsDataUrl,
  processSingleImage,
  processMasterImage,
  processSlotImage,
  SLOT_KEYS,
  BATCH_STATUS,
  STATUS_LABEL,
} from '../../../helpers/fabricImageHelpers'

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  return (
    <span className={`fit-badge fit-badge--${status}`}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

function TypeChip({ type }) {
  if (!type) return null
  const cls = type === 'master' ? 'fit-type-chip--master'
            : type.startsWith('slot') ? 'fit-type-chip--slot'
            : 'fit-type-chip--single'
  const label = type === 'master' ? 'Master'
              : type.startsWith('slot') ? type.toUpperCase().replace('_', ' ')
              : 'Đơn'
  return <span className={`fit-type-chip ${cls}`} style={{ fontSize: '0.7rem', padding: '2px 7px' }}>{label}</span>
}

// Tạo batch item từ File
async function createBatchItem(file, priceTable) {
  const id = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const nccExtracted = extractNccCode(file.name)
  const imageType = detectImageType(file.name)

  let matchResult, selectedEntry
  if (nccExtracted) {
    matchResult = matchNccInPriceTable(nccExtracted, priceTable)
    selectedEntry = matchResult.type === BATCH_STATUS.FOUND ? matchResult.matches[0] : null
  } else {
    matchResult = { type: BATCH_STATUS.INVALID, matches: [] }
    selectedEntry = null
  }

  // Thumbnail nhỏ để hiển thị trong bảng (không cần chất lượng cao)
  let thumbUrl = null
  try {
    thumbUrl = await loadImageAsDataUrl(file, 120)
  } catch (_) { /* thumbnail không quan trọng */ }

  return {
    id, file, name: file.name,
    nccExtracted: nccExtracted || '',
    imageType,
    matchResult,
    selectedEntry,
    thumbUrl,
    status: matchResult.type === BATCH_STATUS.FOUND ? BATCH_STATUS.FOUND
          : matchResult.type === BATCH_STATUS.INVALID ? BATCH_STATUS.INVALID
          : BATCH_STATUS[matchResult.type.toUpperCase()] || BATCH_STATUS.PENDING,
    processedSlots: null,
    error: null,
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BatchProcessor({ priceTable, onSaveImages }) {
  const [items, setItems] = useState([])
  const [isDrag, setIsDrag] = useState(false)
  const [globalStatus, setGlobalStatus] = useState(null) // null | 'processing' | 'done'
  const processingRef = useRef(false)

  // Thêm files vào danh sách
  async function addFiles(files) {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!fileArr.length) return

    // Tạo items
    const newItems = await Promise.all(fileArr.map((f) => createBatchItem(f, priceTable)))
    setItems((prev) => [...prev, ...newItems])
  }

  // Drag-drop
  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDrag(true) }, [])
  const onDragLeave = useCallback(() => setIsDrag(false), [])
  const onDrop = useCallback((e) => {
    e.preventDefault(); setIsDrag(false)
    addFiles(e.dataTransfer.files)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceTable])

  // Cập nhật 1 item
  function updateItem(id, updates) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item))
  }

  // Xử lý 1 item
  async function processOne(item) {
    updateItem(item.id, { status: BATCH_STATUS.PROCESSING, error: null })
    try {
      let slots
      if (item.imageType === 'master') {
        slots = await processMasterImage(item.file)
      } else if (item.imageType.startsWith('slot_')) {
        slots = await processSlotImage(item.file, item.imageType)
      } else {
        const result = await processSingleImage(item.file)
        slots = { surface_texture: result }
      }
      updateItem(item.id, { status: BATCH_STATUS.DONE, processedSlots: slots })
    } catch (err) {
      updateItem(item.id, { status: BATCH_STATUS.ERROR, error: err.message })
    }
  }

  // Xử lý tất cả items có thể xử lý (found/multiple đã chọn)
  async function processAllValid() {
    if (processingRef.current) return
    processingRef.current = true
    setGlobalStatus('processing')

    const toProcess = items.filter(
      (item) => item.selectedEntry && item.status !== BATCH_STATUS.DONE && item.status !== BATCH_STATUS.PROCESSING,
    )
    for (const item of toProcess) {
      await processOne(item)
    }

    processingRef.current = false
    setGlobalStatus('done')
  }

  // Lưu tất cả items đã xử lý xong
  async function saveAllDone() {
    const toSave = items.filter(
      (item) => item.status === BATCH_STATUS.DONE && item.selectedEntry && item.processedSlots,
    )
    let saved = 0
    for (const item of toSave) {
      try {
        await onSaveImages?.(item.selectedEntry.maNCC, item.processedSlots)
        updateItem(item.id, { status: 'saved' })
        saved++
      } catch (_) {
        updateItem(item.id, { status: BATCH_STATUS.ERROR, error: 'Lỗi khi lưu' })
      }
    }
    if (saved > 0) setGlobalStatus('saved')
  }

  // Xóa 1 item
  function removeItem(id) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Xóa tất cả
  function clearAll() {
    setItems([])
    setGlobalStatus(null)
  }

  // Chọn entry thủ công khi multiple/partial
  function selectEntry(itemId, entry) {
    setItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item
      return {
        ...item,
        selectedEntry: entry,
        status: BATCH_STATUS.FOUND,
      }
    }))
  }

  const countFound = items.filter((i) => i.selectedEntry).length
  const countDone  = items.filter((i) => i.status === BATCH_STATUS.DONE).length
  const countSaved = items.filter((i) => i.status === 'saved').length

  return (
    <div className="fit-batch">

      {/* Upload zone */}
      <div
        className={`fit-upload-zone${isDrag ? ' fit-upload-zone--drag' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{ padding: '24px 20px' }}
      >
        <div className="fit-upload-icon">📂</div>
        <div className="fit-upload-label">Kéo thả nhiều ảnh vải vào đây, hoặc click để chọn</div>
        <div className="fit-upload-hint">
          Hỗ trợ: JPG · PNG · WebP · Tên file phải chứa mã NCC
        </div>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/*"
          multiple
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <>
          {/* Action bar */}
          <div className="fit-batch-bar">
            <span className="fit-batch-count">
              {items.length} file · {countFound} tìm được NCC · {countDone} đã xử lý · {countSaved} đã lưu
            </span>

            <button
              className="btn btn-primary btn-xs"
              disabled={countFound === 0 || globalStatus === 'processing'}
              onClick={processAllValid}
            >
              {globalStatus === 'processing' ? '⏳ Đang xử lý…' : `▶ Xử lý ${countFound} file hợp lệ`}
            </button>

            {countDone > 0 && (
              <button
                className="btn btn-primary btn-xs"
                onClick={saveAllDone}
              >
                💾 Lưu {countDone} file đã xử lý
              </button>
            )}

            <button className="btn btn-secondary btn-xs" onClick={clearAll}>
              ✕ Xóa tất cả
            </button>
          </div>

          {/* Bảng danh sách */}
          <div className="fit-batch-table-wrap">
            <table className="fit-batch-table">
              <thead>
                <tr>
                  <th style={{ width: 54 }}>Preview</th>
                  <th>Tên file</th>
                  <th>Loại</th>
                  <th>Mã NCC dò được</th>
                  <th>Trạng thái</th>
                  <th>Thông tin NCC</th>
                  <th style={{ width: 80 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <BatchRow
                    key={item.id}
                    item={item}
                    onProcess={() => processOne(item)}
                    onRemove={() => removeItem(item.id)}
                    onSelectEntry={(entry) => selectEntry(item.id, entry)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── BatchRow — 1 dòng trong bảng ─────────────────────────────────────────────

function BatchRow({ item, onProcess, onRemove, onSelectEntry }) {
  const [showMatches, setShowMatches] = useState(false)

  const entry = item.selectedEntry
  const multipleOrPartial = (
    item.matchResult?.type === BATCH_STATUS.MULTIPLE ||
    item.matchResult?.type === BATCH_STATUS.PARTIAL
  ) && item.matchResult.matches.length > 0

  return (
    <tr>
      {/* Thumbnail */}
      <td>
        {item.thumbUrl ? (
          <img src={item.thumbUrl} alt={item.name} className="fit-batch-thumb" />
        ) : (
          <div style={{ width: 48, height: 36, background: 'var(--color-accent-light)', borderRadius: 4 }} />
        )}
      </td>

      {/* Tên file */}
      <td>
        <div className="fit-batch-filename" title={item.name}>{item.name}</div>
      </td>

      {/* Loại */}
      <td><TypeChip type={item.imageType} /></td>

      {/* Mã NCC */}
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {item.nccExtracted ? (
            <span className="fit-batch-ncc">{item.nccExtracted}</span>
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>—</span>
          )}

          {/* Nếu nhiều kết quả → cho chọn */}
          {multipleOrPartial && (
            <>
              <button
                className="fit-reset-btn"
                onClick={() => setShowMatches((v) => !v)}
                style={{ fontSize: '0.72rem', textAlign: 'left' }}
              >
                {showMatches ? '▲ Ẩn' : `▼ ${item.matchResult.matches.length} kết quả`}
              </button>
              {showMatches && (
                <div className="fit-match-list" style={{ maxHeight: 120, minWidth: 200 }}>
                  {item.matchResult.matches.map((e) => (
                    <div
                      key={e.id || e.maNCC}
                      className={`fit-match-item${item.selectedEntry?.maNCC === e.maNCC ? ' fit-match-item--on' : ''}`}
                      onClick={() => { onSelectEntry(e); setShowMatches(false) }}
                    >
                      <span className="fit-match-code">{e.maNCC}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {e.nhaCungCap}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </td>

      {/* Trạng thái */}
      <td>
        <StatusBadge status={item.status === 'saved' ? 'done' : item.status} />
        {item.status === 'saved' && (
          <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', display: 'block', marginTop: 2 }}>✓ Đã lưu</span>
        )}
        {item.error && (
          <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginTop: 2 }}>{item.error}</div>
        )}
      </td>

      {/* Thông tin NCC */}
      <td>
        {entry ? (
          <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontWeight: 700 }}>{entry.nhaCungCap}</span>
            {entry.tenCuon && <span style={{ color: 'var(--color-text-muted)' }}>{entry.tenCuon}</span>}
            {entry.dongSanPham && <span style={{ color: 'var(--color-text-muted)' }}>{entry.dongSanPham}</span>}
          </div>
        ) : (
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>—</span>
        )}
      </td>

      {/* Hành động */}
      <td>
        <div className="fit-batch-actions">
          {item.status !== BATCH_STATUS.DONE && item.status !== 'saved' && item.selectedEntry && (
            <button
              className="btn btn-primary btn-xs"
              disabled={item.status === BATCH_STATUS.PROCESSING}
              onClick={onProcess}
              title="Xử lý ảnh này"
            >
              ▶
            </button>
          )}
          <button
            className="btn btn-secondary btn-xs"
            onClick={onRemove}
            title="Xóa khỏi danh sách"
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  )
}
