import { useState, useCallback } from 'react'
import { unzip } from 'fflate'
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
  single: 'Bề mặt (ô 1)',
  master: 'Master 3×2 → 6 ô',
  zip:    'ZIP → tối đa 6 ô',
  slot_1: 'Ô 1 — Bề mặt',
  slot_2: 'Ô 2 — Cận chất liệu',
  slot_3: 'Ô 3 — Cầm nắm',
  slot_4: 'Ô 4 — Thành phẩm ~1m',
  slot_5: 'Ô 5 — Nội thất ~2m',
  slot_6: 'Ô 6 — Kỹ thuật',
}

function fieldForType(type) {
  if (type === 'master') return null
  if (type === 'single' || type === 'slot_1') return 'surface_texture'
  const sk = SLOT_KEYS.find((s) => s.slot === type)
  return sk?.field || null
}

// ── Entry factories ───────────────────────────────────────────────────────────

function createImageEntry(file, priceTable) {
  const ncc   = extractNccCode(file.name) || ''
  const type  = detectImageType(file.name)
  const match = ncc
    ? matchNccInPriceTable(ncc, priceTable)
    : { type: BATCH_STATUS.INVALID, matches: [] }
  return {
    id:         `img-${file.name}-${Math.random().toString(36).slice(2, 8)}`,
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

function createZipEntry(file, priceTable) {
  const ncc   = file.name.replace(/\.zip$/i, '').trim()
  const match = ncc
    ? matchNccInPriceTable(ncc, priceTable)
    : { type: BATCH_STATUS.INVALID, matches: [] }
  return {
    id:         `zip-${file.name}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    previewUrl: null,
    ncc,
    type:       'zip',
    match,
    status:     S.PENDING,
    result:     null,
    error:      null,
  }
}

// ── Processing ────────────────────────────────────────────────────────────────

// Bọc unzip (callback-based) thành Promise
function unzipAsync(uint8) {
  return new Promise((resolve, reject) => {
    unzip(uint8, (err, result) => { err ? reject(err) : resolve(result) })
  })
}

async function processZipFile(entry) {
  const buffer  = await entry.file.arrayBuffer()
  const files   = await unzipAsync(new Uint8Array(buffer))

  // Lọc file ảnh (bỏ thư mục ẩn macOS __MACOSX)
  const images = Object.entries(files).filter(
    ([path]) => !/^__MACOSX/i.test(path) && /\.(jpg|jpeg|png|webp)$/i.test(path),
  )

  if (!images.length) throw new Error('Không tìm thấy ảnh trong ZIP')

  // Sắp xếp theo số đầu tiên trong tên file
  images.sort(([a], [b]) => {
    const basename = (p) => p.split('/').pop()
    const num = (p) => parseInt(basename(p).match(/\d+/)?.[0] ?? '9999')
    const diff = num(a) - num(b)
    return diff !== 0 ? diff : basename(a).localeCompare(basename(b))
  })

  // Gán lần lượt vào slot 1 → 6
  const result = {}
  const limit  = Math.min(images.length, SLOT_KEYS.length)
  for (let i = 0; i < limit; i++) {
    const [path, bytes] = images[i]
    const ext      = path.match(/\.(png|webp)$/i)?.[1]?.toLowerCase()
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    const blob     = new Blob([bytes], { type: mimeType })
    const imgFile  = new File([blob], path.split('/').pop(), { type: mimeType })
    result[SLOT_KEYS[i].field] = await loadImageAsDataUrl(imgFile, 1400)
  }

  return result
}

async function processImageEntry(entry) {
  const { file, type } = entry
  if (type === 'master') return await processMasterImage(file)
  const field = fieldForType(type)
  if (!field) throw new Error(`Loại ảnh không hỗ trợ: ${type}`)
  return { [field]: await loadImageAsDataUrl(file, 1400) }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SlotThumbs({ result }) {
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
  if (type === BATCH_STATUS.FOUND)     return <span className="fit-badge fit-badge--found">✓ Tìm thấy</span>
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
    const newEntries = []
    for (const f of Array.from(fileList)) {
      if (/\.zip$/i.test(f.name)) {
        newEntries.push(createZipEntry(f, priceTable))
      } else if (f.type.startsWith('image/')) {
        newEntries.push(createImageEntry(f, priceTable))
      }
    }
    if (newEntries.length) setEntries((prev) => [...prev, ...newEntries])
  }

  function removeEntry(id) {
    setEntries((prev) => {
      const e = prev.find((x) => x.id === id)
      if (e?.previewUrl) URL.revokeObjectURL(e.previewUrl)
      return prev.filter((x) => x.id !== id)
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
        const result = entry.type === 'zip'
          ? await processZipFile(entry)
          : await processImageEntry(entry)
        const maNCC = entry.match.type === BATCH_STATUS.FOUND
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
        <span>Kéo thả file ZIP hoặc ảnh để import thẳng vào thư viện, bỏ qua AI.</span>
        <span className="fit-di-intro-conventions">
          <strong>ZIP (khuyến nghị):</strong>&nbsp;
          <code>A15-5.zip</code> chứa <code>1.jpg</code> → ô 1, <code>2.jpg</code> → ô 2 … <code>6.jpg</code> → ô 6
          &nbsp;·&nbsp;
          <strong>Ảnh rời:</strong>&nbsp;
          <code>A15-5_1.jpg</code> → ô 1 &nbsp;·&nbsp; <code>A15-5_master.jpg</code> → tách 3×2
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
        <div className="fit-upload-label">Kéo thả file ZIP hoặc ảnh vào đây</div>
        <div className="fit-upload-hint">ZIP · JPG · PNG · WebP — nhiều file cùng lúc</div>
        <input
          type="file"
          accept="image/*,.zip,application/zip"
          multiple
          onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
        />
      </div>

      {/* File list */}
      {entries.length > 0 && (
        <>
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
              <button className="btn btn-secondary btn-sm" onClick={clearAll}>Xoá tất cả</button>
            )}
          </div>

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

                    {/* Thumbnail / ZIP icon / Kết quả */}
                    <td>
                      {entry.status === S.DONE && entry.result ? (
                        <SlotThumbs result={entry.result} />
                      ) : entry.type === 'zip' ? (
                        <div className="fit-batch-thumb fit-batch-thumb--zip">📦</div>
                      ) : (
                        <img src={entry.previewUrl} alt="" className="fit-batch-thumb" />
                      )}
                    </td>

                    <td>
                      <span className="fit-batch-filename" title={entry.file.name}>
                        {entry.file.name}
                      </span>
                    </td>

                    <td>
                      {entry.ncc
                        ? <span className="fit-batch-ncc">{entry.ncc}</span>
                        : <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>—</span>
                      }
                    </td>

                    <td>
                      <span style={{ fontSize: '0.78rem' }}>{TYPE_LABEL[entry.type] || entry.type}</span>
                    </td>

                    <td><MatchBadge match={entry.match} /></td>

                    <td>
                      {entry.status === S.PENDING    && <span className="fit-badge fit-badge--pending">Chờ</span>}
                      {entry.status === S.PROCESSING && <span className="fit-badge fit-badge--processing">Đang xử lý…</span>}
                      {entry.status === S.DONE       && <span className="fit-badge fit-badge--done">✓ Đã lưu</span>}
                      {entry.status === S.ERROR      && (
                        <span className="fit-badge fit-badge--error" title={entry.error}>Lỗi</span>
                      )}
                    </td>

                    <td>
                      {entry.status !== S.PROCESSING && (
                        <button className="fit-reset-btn" onClick={() => removeEntry(entry.id)} title="Xoá">✕</button>
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
