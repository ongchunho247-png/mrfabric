import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  extractNccCode,
  detectImageType,
  matchNccInPriceTable,
  findColorVariants,
  loadImageAsDataUrl,
  SLOT_KEYS,
  BATCH_STATUS,
  STATUS_LABEL,
} from '../../../helpers/fabricImageHelpers'
import MultiColorGenerator from './MultiColorGenerator'
import BudgetCard from './BudgetCard'
import {
  detectProductType,
  getSlotTemplate,
  ALL_PRODUCT_TYPES,
} from '../../../helpers/productTypeHelpers'

// ── Shared sub-components ─────────────────────────────────────────────────────

function StatusBadge({ status }) {
  return (
    <span className={`fit-badge fit-badge--${status}`}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

function InfoRow({ label, value, highlight }) {
  if (!value) return null
  return (
    <div className={`fit-info-row${highlight ? ' fit-info-row--hl' : ''}`}>
      <span className="fit-info-label">{label}</span>
      <span className="fit-info-value">{value}</span>
    </div>
  )
}

function TypeChip({ type }) {
  const cls = type === 'master' ? 'fit-type-chip--master'
    : type.startsWith('slot') ? 'fit-type-chip--slot'
    : 'fit-type-chip--single'
  const label = type === 'master' ? 'Master (3×2 grid)'
    : type.startsWith('slot') ? type.toUpperCase().replace('_', ' ')
    : 'Ảnh đơn'
  return <span className={`fit-type-chip ${cls}`}>{label}</span>
}

// ── Type & template detection card ───────────────────────────────────────────

function TypeTemplateCard({ entry, productType, manualType, onSetManualType, slotTemplate }) {
  const dongSanPham = entry?.dongSanPham || ''

  return (
    <div className="fit-card fit-type-tpl-card">
      <div className="fit-card-title">Dòng sản phẩm & Template AI</div>

      <InfoRow label="Dòng sản phẩm" value={dongSanPham || '—'} />

      <div className="fit-type-tpl-row">
        <span className="fit-info-label">Type nhận diện:</span>
        {productType ? (
          <span className="fit-type-badge fit-type-badge--ok">{productType}</span>
        ) : (
          <span className="fit-type-badge fit-type-badge--warn">Chưa nhận diện</span>
        )}
      </div>

      {!productType && (
        <div className="fit-phase-notice" style={{ color: '#92400e', background: '#fef3c7', borderLeftColor: '#f59e0b' }}>
          ⚠ Không xác định được dòng sản phẩm từ &quot;{dongSanPham || '(trống)'}&quot;.
          Chọn type thủ công để dùng đúng template AI.
        </div>
      )}

      <div className="fit-type-tpl-row">
        <span className="fit-info-label">Type dùng:</span>
        <select
          className="fit-type-select"
          value={manualType || productType || ''}
          onChange={(e) => onSetManualType(e.target.value || null)}
        >
          {!productType && <option value="">— Chọn thủ công —</option>}
          {ALL_PRODUCT_TYPES.map((t) => (
            <option key={t.code} value={t.code}>
              {t.label} [{t.code}]{productType === t.code ? ' ✓ tự động' : ''}
            </option>
          ))}
        </select>
        {manualType && manualType !== productType && (
          <button
            className="fit-reset-btn"
            onClick={() => onSetManualType(null)}
            title="Trở về type tự động"
          >
            ✕ Bỏ
          </button>
        )}
      </div>

      {!slotTemplate && (productType || manualType) && (
        <div className="fit-phase-notice">
          Chưa có template cho type &quot;{manualType || productType}&quot;.
        </div>
      )}
    </div>
  )
}

// ── Phase: Product info card ──────────────────────────────────────────────────

function ProductInfoCard({ entry, nhomBienThe, variantCount }) {
  if (!entry) return null
  return (
    <div className="fit-card">
      <div className="fit-card-title">Thông tin sản phẩm</div>
      <InfoRow label="Mã MrFabric"      value={entry.maMrFabric}    highlight />
      <InfoRow label="Mã sản phẩm NCC"  value={entry.maNCC} />
      <InfoRow label="Nhóm biến thể"    value={nhomBienThe || entry.nhomVatLieu || entry.nhomBienThe || entry.variantGroup} highlight />
      {variantCount > 1 && (
        <InfoRow label="Số biến thể màu" value={`${variantCount} màu cùng nhóm`} />
      )}
      <InfoRow label="Tên cuốn mẫu MrFabric" value={entry.tenCuonMauMrFabric || entry.tenCuonMrFabric} />
      <InfoRow label="Tên cuốn mẫu NCC" value={entry.tenCuon || entry.nccCatalogueName} />
      <InfoRow label="Số trang"         value={entry.soTrang} />
      <InfoRow label="Tên NCC"          value={entry.nhaCungCap} />
      <InfoRow label="Phân khúc"        value={entry.phanKhuc} />
      <InfoRow label="Đơn sản phẩm"     value={entry.dongSanPham} />
      <InfoRow label="Thành phần"       value={entry.thanhPhan} />
      <InfoRow label="Nhóm màu"         value={entry.nhomMau} />
      <InfoRow label="Bề mặt"           value={Array.isArray(entry.beMat) ? entry.beMat.join(', ') : entry.beMat} />
      <InfoRow label="Khổ vải"          value={entry.khoVai ? `${entry.khoVai} cm` : ''} />
    </div>
  )
}

// ── Phase 2: Ruler detection card ─────────────────────────────────────────────

function RulerCard({ file, onScaleConfirmed, confirmedScale }) {
  const [status, setStatus] = useState('idle') // idle | detecting | done | failed
  const [result, setResult] = useState(null)
  const [showManual, setShowManual] = useState(false)
  const [manualFrom, setManualFrom] = useState('0')
  const [manualTo, setManualTo] = useState('15')
  const [manualUnit, setManualUnit] = useState('cm')

  async function detect() {
    if (!file) return
    setStatus('detecting')
    setResult(null)
    try {
      const imageUrl = await loadImageAsDataUrl(file, 1400)
      const res = await fetch('/api/ai/detect-ruler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })
      const data = await res.json()
      setResult(data)
      setStatus(data.ruler_detected ? 'done' : 'failed')
    } catch (err) {
      setResult({ message_vn: `Lỗi: ${err.message}` })
      setStatus('failed')
    }
  }

  function confirmAuto() {
    onScaleConfirmed({
      scale_source: 'ruler_in_original_image',
      reference_unit: result.unit || 'cm',
      pixel_per_mm: result.pixel_per_mm || null,
      reference_length_detected: `${result.range_start ?? 0}–${result.range_end} ${result.unit || 'cm'}`,
      scale_confirmed_by_admin: true,
      confidence: result.confidence,
    })
  }

  function confirmManual() {
    onScaleConfirmed({
      scale_source: 'manual_input',
      reference_unit: manualUnit,
      pixel_per_mm: null,
      reference_length_detected: `${manualFrom}–${manualTo} ${manualUnit} (nhập tay)`,
      scale_confirmed_by_admin: true,
      confidence: 'manual',
    })
  }

  // Already confirmed
  if (confirmedScale) {
    return (
      <div className="fit-card fit-ruler-card fit-ruler-confirmed-card">
        <div className="fit-card-title">Tỉ lệ thước đo ✓</div>
        <div className="fit-ruler-confirmed-info">
          <span>{confirmedScale.reference_length_detected}</span>
          {confirmedScale.scale_source === 'manual_input' && (
            <span className="fit-ruler-tag">nhập tay</span>
          )}
          {confirmedScale.pixel_per_mm && (
            <span className="fit-ruler-tag">{confirmedScale.pixel_per_mm.toFixed(1)} px/mm</span>
          )}
        </div>
        <button className="fit-reset-btn" onClick={() => onScaleConfirmed(null)}>
          Đo lại
        </button>
      </div>
    )
  }

  return (
    <div className="fit-card fit-ruler-card">
      <div className="fit-card-title">Nhận diện thước đo</div>
      <div className="fit-ruler-hint">
        Ảnh gốc phải có thước đo. Hệ thống cần đọc thước để xác định đúng tỉ lệ họa tiết.
        Không tự suy luận scale nếu chưa xác nhận thước.
      </div>

      {status === 'idle' && (
        <div className="fit-ruler-btns">
          <button className="btn btn-secondary btn-xs" onClick={detect}>
            🔍 Phát hiện thước tự động
          </button>
          <button className="btn btn-secondary btn-xs" onClick={() => setShowManual(true)}>
            ✏️ Nhập tay
          </button>
          <button className="fit-reset-btn" onClick={() => onScaleConfirmed(null)}>
            Bỏ qua (không có thước)
          </button>
        </div>
      )}

      {status === 'detecting' && (
        <div className="fit-ruler-status">⏳ Đang phân tích ảnh để tìm thước đo…</div>
      )}

      {status === 'done' && result && (
        <div className="fit-ruler-result">
          <div className={`fit-ruler-msg fit-ruler-msg--${result.confidence}`}>
            {result.message_vn}
          </div>
          {(result.confidence === 'high' || result.confidence === 'medium') ? (
            <div className="fit-ruler-btns">
              <button className="btn btn-primary btn-xs" onClick={confirmAuto}>
                ✓ Xác nhận: {result.range_start ?? 0}–{result.range_end} {result.unit}
              </button>
              <button className="btn btn-secondary btn-xs" onClick={() => setShowManual(true)}>
                Nhập tay thay thế
              </button>
            </div>
          ) : (
            <>
              <div className="fit-phase-notice">
                Độ tin cậy thấp — vui lòng xác nhận thủ công.
              </div>
              <button className="btn btn-secondary btn-xs" onClick={() => setShowManual(true)}>
                ✏️ Nhập tay
              </button>
            </>
          )}
        </div>
      )}

      {status === 'failed' && (
        <div className="fit-ruler-result">
          <div className="fit-ruler-msg fit-ruler-msg--warn">
            {result?.message_vn || 'Không phát hiện được thước đo.'}
          </div>
          <div className="fit-ruler-btns">
            <button className="btn btn-secondary btn-xs" onClick={detect}>
              Thử lại
            </button>
            <button className="btn btn-secondary btn-xs" onClick={() => setShowManual(true)}>
              ✏️ Nhập tay
            </button>
            <button className="fit-reset-btn" onClick={() => onScaleConfirmed(null)}>
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      {showManual && (
        <div className="fit-ruler-manual">
          <div className="fit-ruler-manual-title">Nhập phạm vi thước thủ công:</div>
          <div className="fit-ruler-manual-row">
            <span>Từ</span>
            <input
              type="number" value={manualFrom} min="0"
              onChange={(e) => setManualFrom(e.target.value)}
              style={{ width: 55 }}
            />
            <span>đến</span>
            <input
              type="number" value={manualTo} min="1"
              onChange={(e) => setManualTo(e.target.value)}
              style={{ width: 55 }}
            />
            <select value={manualUnit} onChange={(e) => setManualUnit(e.target.value)}>
              <option value="cm">cm</option>
              <option value="mm">mm</option>
            </select>
          </div>
          <button className="btn btn-primary btn-xs" onClick={confirmManual}>
            ✓ Xác nhận {manualFrom}–{manualTo} {manualUnit}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Phase 3: Grain direction picker ──────────────────────────────────────────

/*
 * fabricGrain lưu dạng: 'kho' | 'cuon'
 *   'kho'  = vân chạy theo chiều KHỔ VẢI (→ ngang, vuông góc cuộn)
 *   'cuon' = vân chạy theo chiều CUỘN VẢI (↑ dọc, song song cuộn)
 */

// Icon âm bản: cuộn vải nằm bên trái, vải trải ngang sang phải, mũi tên →
function GrainIconKho({ size = 100 }) {
  const h = Math.round(size * 0.65)
  return (
    <svg viewBox="0 0 100 65" width={size} height={h} xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="65" rx="5" fill="#1c1c1c"/>
      {/* cylinder */}
      <ellipse cx="14" cy="32" rx="9" ry="14" fill="#2e2e2e" stroke="#ccc" strokeWidth="1.2"/>
      <ellipse cx="14" cy="32" rx="5.5" ry="8.5" fill="#252525" stroke="#aaa" strokeWidth="0.9"/>
      <ellipse cx="14" cy="32" rx="2" ry="3.5" fill="#1c1c1c" stroke="#888" strokeWidth="0.7"/>
      {/* fabric panel — landscape */}
      <rect x="23" y="10" width="68" height="43" rx="1" fill="#262626" stroke="#bbb" strokeWidth="1"/>
      {/* horizontal arrow → */}
      <line x1="30" y1="52" x2="78" y2="52" stroke="#fff" strokeWidth="1.8"/>
      <polygon points="78,49 84,52 78,55" fill="#fff"/>
    </svg>
  )
}

// Icon âm bản: cuộn vải nằm bên trái, vải trải dọc lên trên, mũi tên ↑
function GrainIconCuon({ size = 100 }) {
  const h = Math.round(size * 0.65)
  return (
    <svg viewBox="0 0 100 65" width={size} height={h} xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="65" rx="5" fill="#1c1c1c"/>
      {/* cylinder */}
      <ellipse cx="14" cy="32" rx="9" ry="14" fill="#2e2e2e" stroke="#ccc" strokeWidth="1.2"/>
      <ellipse cx="14" cy="32" rx="5.5" ry="8.5" fill="#252525" stroke="#aaa" strokeWidth="0.9"/>
      <ellipse cx="14" cy="32" rx="2" ry="3.5" fill="#1c1c1c" stroke="#888" strokeWidth="0.7"/>
      {/* fabric panel — portrait */}
      <rect x="28" y="5" width="60" height="55" rx="1" fill="#262626" stroke="#bbb" strokeWidth="1"/>
      {/* vertical arrow ↑ */}
      <line x1="48" y1="52" x2="48" y2="14" stroke="#fff" strokeWidth="1.8"/>
      <polygon points="45,14 48,8 51,14" fill="#fff"/>
    </svg>
  )
}

function GrainCard({ previewUrl, fabricGrain, onChange }) {
  return (
    <div className="fit-card fit-orient-card">
      <div className="fit-card-title">Chiều vân vải</div>
      {previewUrl && (
        <img src={previewUrl} alt="Ảnh gốc" className="fit-surface-thumb" style={{ marginBottom: 10 }} />
      )}
      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 10 }}>
        Vân vải chạy theo hướng nào của cuộn vải?
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { value: 'kho',  Icon: GrainIconKho },
          { value: 'cuon', Icon: GrainIconCuon },
        ].map(({ value, Icon }) => (
          <button
            key={value}
            onClick={() => onChange(value)}
            style={{
              padding: 0,
              border: fabricGrain === value
                ? '2px solid var(--color-primary, #3b82f6)'
                : '2px solid #444',
              borderRadius: 8,
              background: 'none',
              cursor: 'pointer',
              opacity: fabricGrain && fabricGrain !== value ? 0.4 : 1,
              transition: 'border-color 0.15s, opacity 0.15s',
              display: 'block',
              lineHeight: 0,
            }}
            title={value === 'kho' ? '→ Vân theo khổ vải' : '↑ Vân theo chiều cuộn'}
          >
            <Icon size={110} />
          </button>
        ))}
      </div>
      {fabricGrain && (
        <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--color-success, #16a34a)', lineHeight: 1.5 }}>
          ✓ {fabricGrain === 'kho'
            ? '→ Vân theo khổ vải — vuông góc chiều cuộn'
            : '↑ Vân theo chiều cuộn — song song chiều cuộn'}
        </div>
      )}
    </div>
  )
}

// ── Phase 4: Scope selection ──────────────────────────────────────────────────

function ScopeCard({ colorVariants, baseEntry, scope, setScope, selectedNccs, setSelectedNccs }) {
  if (colorVariants.length <= 1) return null

  function toggleNcc(maNCC, checked) {
    const next = new Set(selectedNccs || [])
    if (checked) next.add(maNCC)
    else next.delete(maNCC)
    setSelectedNccs(next)
  }

  return (
    <div className="fit-card fit-scope-card">
      <div className="fit-card-title">Phạm vi xử lý AI</div>
      <div className="fit-scope-radios">
        <label className="fit-scope-radio">
          <input type="radio" name="scope" value="current" checked={scope === 'current'}
            onChange={() => setScope('current')} />
          Chỉ mã hiện tại
          <span className="fit-scope-tag">{baseEntry?.maNCC} — {baseEntry?.nhomMau}</span>
        </label>
        <label className="fit-scope-radio">
          <input type="radio" name="scope" value="all" checked={scope === 'all'}
            onChange={() => setScope('all')} />
          Toàn bộ nhóm biến thể
          <span className="fit-scope-tag">{colorVariants.length} mã</span>
        </label>
        <label className="fit-scope-radio">
          <input type="radio" name="scope" value="selected" checked={scope === 'selected'}
            onChange={() => {
              setScope('selected')
              if (!selectedNccs) setSelectedNccs(new Set([baseEntry?.maNCC].filter(Boolean)))
            }} />
          Chọn từng mã
        </label>
      </div>

      {scope === 'selected' && (
        <div className="fit-scope-checklist">
          {colorVariants.map((cv) => (
            <label key={cv.maNCC} className="fit-scope-check">
              <input
                type="checkbox"
                checked={selectedNccs?.has(cv.maNCC) ?? false}
                onChange={(e) => toggleNcc(cv.maNCC, e.target.checked)}
              />
              <span className="fit-scope-check-label">
                {cv.nhomMau || '—'}
                <span className="fit-scope-check-code">{cv.maNCC}</span>
                {cv.maMrFabric && <span className="fit-scope-check-code">{cv.maMrFabric}</span>}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SingleProcessor({ priceTable, nccCodes, onSaveImages }) {
  // File & NCC
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [nccExtracted, setNccExtracted] = useState('')
  const [nccInput, setNccInput] = useState('')
  const [imageType, setImageType] = useState('single')
  const [matchResult, setMatchResult] = useState(null)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [isDrag, setIsDrag] = useState(false)

  // Phase 2: Ruler scale
  const [scaleMetadata, setScaleMetadata] = useState(null)

  // Phase 3: raw surface URL (ảnh gốc, không xử lý canvas) + chiều vân
  const [rawSurfaceUrl, setRawSurfaceUrl] = useState(null)
  const [fabricGrain, setFabricGrain] = useState(null) // 'ngang' | 'doc'

  // Khi file thay đổi: chỉ load sang data URL (1 lần encode) để gửi API
  useEffect(() => {
    if (!file) return
    let cancelled = false
    setRawSurfaceUrl(null)
    setFabricGrain(null)
    loadImageAsDataUrl(file, 1400).then((url) => {
      if (!cancelled) setRawSurfaceUrl(url)
    }).catch((err) => console.error('[FIT] Load image error:', err))
    return () => { cancelled = true }
  }, [file])

  // Phase 4: Scope
  const [scope, setScope] = useState('all')
  const [selectedNccs, setSelectedNccs] = useState(null)

  // Type detection
  const [manualType, setManualType] = useState(null)
  const productType = useMemo(
    () => detectProductType(selectedEntry?.dongSanPham || ''),
    [selectedEntry],
  )
  const activeType = manualType || productType
  const slotTemplate = useMemo(() => getSlotTemplate(activeType), [activeType])

  // Tìm tất cả biến thể màu theo Nhóm biến thể
  const colorVariants = useMemo(() => {
    if (!selectedEntry || !priceTable) return []
    return findColorVariants(selectedEntry.maNCC, priceTable)
  }, [selectedEntry, priceTable])

  // Biến thể được chọn theo scope
  const activeVariants = useMemo(() => {
    if (scope === 'current') {
      return colorVariants.filter((cv) => cv.maNCC === selectedEntry?.maNCC)
    }
    if (scope === 'selected' && selectedNccs?.size > 0) {
      return colorVariants.filter((cv) => selectedNccs.has(cv.maNCC))
    }
    return colorVariants // 'all'
  }, [scope, selectedNccs, colorVariants, selectedEntry])

  const nhomBienThe = selectedEntry?.nhomVatLieu || selectedEntry?.nhomBienThe || selectedEntry?.variantGroup || ''

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleFile(f) {
    if (!f) return
    const objectUrl = URL.createObjectURL(f)
    setFile(f)
    setPreviewUrl(objectUrl)
    setRawSurfaceUrl(null)
    setFabricGrain(null)
    setScaleMetadata(null)

    const ncc = extractNccCode(f.name)
    const type = detectImageType(f.name)
    setNccExtracted(ncc || '')
    setNccInput(ncc || '')
    setImageType(type)

    if (ncc) {
      const result = matchNccInPriceTable(ncc, priceTable)
      setMatchResult(result)
      setSelectedEntry(result.type === BATCH_STATUS.FOUND ? result.matches[0] : null)
      setManualType(null)
    } else {
      setMatchResult({ type: BATCH_STATUS.INVALID, matches: [] })
      setSelectedEntry(null)
      setManualType(null)
    }
  }

  function handleManualSearch() {
    const ncc = nccInput.trim()
    if (!ncc) return
    const result = matchNccInPriceTable(ncc, priceTable)
    setMatchResult(result)
    setSelectedEntry(result.type === BATCH_STATUS.FOUND ? result.matches[0] : null)
    setManualType(null)
  }

  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDrag(true) }, [])
  const onDragLeave = useCallback(() => setIsDrag(false), [])
  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDrag(false)
      const f = e.dataTransfer.files?.[0]
      if (f) handleFile(f)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [priceTable],
  )

  function handleReset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null); setPreviewUrl(null)
    setNccExtracted(''); setNccInput('')
    setImageType('single')
    setMatchResult(null); setSelectedEntry(null)
    setRawSurfaceUrl(null); setFabricGrain(null)
    setScaleMetadata(null)
    setScope('all'); setSelectedNccs(null)
  }

  const showGenerator = !!rawSurfaceUrl && colorVariants.length > 0

  return (
    <div className="fit-single">

      {/* Upload zone */}
      {!file && (
        <div
          className={`fit-upload-zone${isDrag ? ' fit-upload-zone--drag' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="fit-upload-icon">🖼</div>
          <div className="fit-upload-label">Kéo thả ảnh vải vào đây hoặc click để chọn</div>
          <div className="fit-upload-hint">
            Tên file: <code>mãNCC.jpg</code> · Ảnh phải có thước đo để xác định tỉ lệ
          </div>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      )}

      {/* Sau khi đã chọn file */}
      {file && (
        <div className="fit-single-cols">

          {/* Cột trái: preview */}
          <div className="fit-preview-col">
            <img src={previewUrl} alt={file.name} className="fit-preview-img" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <TypeChip type={imageType} />
              <button className="fit-reset-btn" onClick={handleReset}>↺ Chọn lại</button>
            </div>
            <div className="fit-card">
              <div className="fit-card-title">Tên file</div>
              <div className="fit-filename">{file.name}</div>
            </div>
          </div>

          {/* Cột phải: NCC + thông tin + thước + xử lý */}
          <div className="fit-info-col">

            {/* Phase 1: NCC detection */}
            <div className="fit-card">
              <div className="fit-card-title">Mã sản phẩm NCC</div>
              <div className="fit-ncc-row">
                {nccExtracted
                  ? <span className="fit-ncc-code">{nccExtracted}</span>
                  : <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Không đọc được từ tên file</span>
                }
                {matchResult && <StatusBadge status={matchResult.type} />}
              </div>

              {(matchResult?.type === BATCH_STATUS.MULTIPLE || matchResult?.type === BATCH_STATUS.PARTIAL) && (
                <div className="fit-match-list">
                  {matchResult.matches.map((e) => (
                    <div
                      key={e.id || e.maNCC}
                      className={`fit-match-item${selectedEntry?.maNCC === e.maNCC ? ' fit-match-item--on' : ''}`}
                      onClick={() => setSelectedEntry(e)}
                    >
                      <span className="fit-match-code">{e.maNCC}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {e.nhaCungCap} · {e.tenCuon}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="fit-ncc-manual">
                <label>Nhập thủ công:</label>
                <input
                  type="text"
                  placeholder="VD: A15-1"
                  value={nccInput}
                  onChange={(e) => setNccInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                />
                <button className="btn btn-secondary btn-xs" onClick={handleManualSearch}>Tìm</button>
              </div>
            </div>

            {/* Type detection & template */}
            {selectedEntry && (
              <TypeTemplateCard
                entry={selectedEntry}
                productType={productType}
                manualType={manualType}
                onSetManualType={setManualType}
                slotTemplate={slotTemplate}
              />
            )}

            {/* Variant group list */}
            {colorVariants.length > 1 && (
              <div className="fit-card">
                <div className="fit-card-title">
                  Nhóm biến thể
                  {nhomBienThe && <span className="fit-mcg-count">{nhomBienThe}</span>}
                  <span className="fit-mcg-count" style={{ background: '#dbeafe', color: '#1e40af' }}>
                    {colorVariants.length} màu
                  </span>
                </div>
                <div className="fit-color-chips">
                  {colorVariants.map((cv) => (
                    <span
                      key={cv.maNCC}
                      className={`fit-color-chip${cv.maNCC === selectedEntry?.maNCC ? ' fit-color-chip--base' : ''}`}
                      title={`Mã MrFabric: ${cv.maMrFabric || 'chưa có'}`}
                    >
                      {cv.nhomMau || cv.maNCC}
                      <span style={{ fontSize: '0.65rem', opacity: 0.7, marginLeft: 3 }}>({cv.maNCC})</span>
                    </span>
                  ))}
                </div>
                {colorVariants.length > 1 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                    Nhóm: {nhomBienThe} — đọc từ cột "Nhóm biến thể"
                  </div>
                )}
              </div>
            )}

            {colorVariants.length === 1 && nhomBienThe === '' && (
              <div className="fit-card">
                <div className="fit-card-title">Nhóm biến thể</div>
                <div className="fit-phase-notice">
                  Mã này chưa có cột "Nhóm biến thể" trong Bảng đơn giá.
                  Sẽ xử lý chỉ mã hiện tại. Để tạo ảnh cho nhiều màu cùng lúc,
                  hãy điền cột "Nhóm biến thể" trong Bảng đơn giá.
                </div>
              </div>
            )}

            {matchResult?.type === BATCH_STATUS.NOT_FOUND && (
              <div className="fit-phase-notice">
                Mã NCC <strong>{nccInput || nccExtracted}</strong> chưa có trong Bảng đơn giá.
              </div>
            )}

            {/* Phase 2: Ruler detection */}
            {file && (
              <RulerCard
                file={file}
                confirmedScale={scaleMetadata}
                onScaleConfirmed={(meta) => setScaleMetadata(meta)}
              />
            )}

            {/* Phase 4: Scope selection */}
            {rawSurfaceUrl && colorVariants.length > 1 && (
              <ScopeCard
                colorVariants={colorVariants}
                baseEntry={selectedEntry}
                scope={scope}
                setScope={setScope}
                selectedNccs={selectedNccs}
                setSelectedNccs={setSelectedNccs}
              />
            )}
          </div>
        </div>
      )}

      {/* Budget tracker — luôn hiện khi có tool AI */}
      {showGenerator && <BudgetCard colorCount={activeVariants.length} />}

      {/* Phase 5+6: MultiColorGenerator */}
      {showGenerator && (
        <MultiColorGenerator
          colorVariants={activeVariants}
          baseSurfaceUrl={rawSurfaceUrl}
          baseNcc={selectedEntry?.maNCC}
          scaleMetadata={scaleMetadata}
          fabricGrain={fabricGrain}
          productType={activeType}
          slotTemplate={slotTemplate}
          onSyncColor={onSaveImages}
        />
      )}

    </div>
  )
}
