import { useState, useCallback } from 'react'
import {
  extractNccCode,
  detectImageType,
  matchNccInPriceTable,
  processSingleImage,
  processMasterImage,
  processSlotImage,
  SLOT_KEYS,
  BATCH_STATUS,
  STATUS_LABEL,
} from '../../../helpers/fabricImageHelpers'
import AIAssistPanel from './AIAssistPanel'
import AIImageGenerator from './AIImageGenerator'

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  return (
    <span className={`fit-badge fit-badge--${status}`}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="fit-info-row">
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

// ── ProductInfoCard — hiển thị thông tin vật liệu khi đã tìm được NCC ────────

function ProductInfoCard({ entry }) {
  if (!entry) return null
  return (
    <div className="fit-card">
      <div className="fit-card-title">Thông tin vật liệu</div>
      <InfoRow label="Mã NCC"       value={entry.maNCC} />
      <InfoRow label="Nhà cung cấp" value={entry.nhaCungCap} />
      <InfoRow label="Cuốn mẫu"     value={entry.tenCuon} />
      <InfoRow label="Dòng sản phẩm"value={entry.dongSanPham} />
      <InfoRow label="Thành phần"   value={entry.thanhPhan} />
      <InfoRow label="Nhóm màu"     value={entry.nhomMau} />
      <InfoRow label="Bề mặt"       value={Array.isArray(entry.beMat) ? entry.beMat.join(', ') : entry.beMat} />
      <InfoRow label="Phân khúc"    value={entry.phanKhuc} />
    </div>
  )
}

// ── SlotPreview — hiển thị 6 slot sau khi tách ───────────────────────────────

function SlotPreview({ slots }) {
  if (!slots) return null
  return (
    <div className="fit-card">
      <div className="fit-card-title">Xem trước 6 slot</div>
      <div className="fit-slot-grid">
        {SLOT_KEYS.map((s) => (
          <div key={s.slot} className="fit-slot-item">
            <span className="fit-slot-label">{s.label}</span>
            {slots[s.field] ? (
              <img src={slots[s.field]} alt={s.label} className="fit-slot-img" />
            ) : (
              <div className="fit-slot-ph">Trống</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SingleProcessor({ priceTable, nccCodes, onSaveImages }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [nccExtracted, setNccExtracted] = useState('')
  const [nccInput, setNccInput] = useState('')
  const [imageType, setImageType] = useState('single')
  const [matchResult, setMatchResult] = useState(null)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [isDrag, setIsDrag] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processedSlots, setProcessedSlots] = useState(null)
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'saved' | 'error'

  // Khi nhận file mới
  function handleFile(f) {
    if (!f) return
    const objectUrl = URL.createObjectURL(f)
    setFile(f)
    setPreviewUrl(objectUrl)
    setProcessedSlots(null)
    setSaveStatus(null)

    const ncc = extractNccCode(f.name)
    const type = detectImageType(f.name)
    setNccExtracted(ncc || '')
    setNccInput(ncc || '')
    setImageType(type)

    if (ncc) {
      const result = matchNccInPriceTable(ncc, priceTable)
      setMatchResult(result)
      setSelectedEntry(result.type === BATCH_STATUS.FOUND ? result.matches[0] : null)
    } else {
      setMatchResult({ type: BATCH_STATUS.INVALID, matches: [] })
      setSelectedEntry(null)
    }
  }

  // Khi admin tự nhập NCC thủ công
  function handleManualSearch() {
    const ncc = nccInput.trim()
    if (!ncc) return
    const result = matchNccInPriceTable(ncc, priceTable)
    setMatchResult(result)
    setSelectedEntry(result.type === BATCH_STATUS.FOUND ? result.matches[0] : null)
  }

  // Drag-drop
  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDrag(true) }, [])
  const onDragLeave = useCallback(() => setIsDrag(false), [])
  const onDrop = useCallback((e) => {
    e.preventDefault(); setIsDrag(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceTable])

  // Xử lý ảnh (Phase 2 + 3)
  async function handleProcess() {
    if (!file) return
    setProcessing(true)
    setSaveStatus(null)
    try {
      let slots
      if (imageType === 'master') {
        slots = await processMasterImage(file)
      } else if (imageType.startsWith('slot_')) {
        slots = await processSlotImage(file, imageType)
      } else {
        // single → surface_texture
        const result = await processSingleImage(file)
        slots = { surface_texture: result }
      }
      setProcessedSlots(slots)
    } catch (err) {
      console.error('[FIT] Process error:', err)
      setSaveStatus('error')
    } finally {
      setProcessing(false)
    }
  }

  // Lưu vào adminMaterials
  async function handleSave() {
    if (!selectedEntry || !processedSlots) return
    setSaveStatus('saving')
    try {
      await onSaveImages?.(selectedEntry.maNCC, processedSlots)
      setSaveStatus('saved')
    } catch (err) {
      console.error('[FIT] Save error:', err)
      setSaveStatus('error')
    }
  }

  // Reset toàn bộ
  function handleReset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null); setPreviewUrl(null)
    setNccExtracted(''); setNccInput('')
    setImageType('single')
    setMatchResult(null); setSelectedEntry(null)
    setProcessedSlots(null); setSaveStatus(null)
  }

  const canProcess = !!file && !processing
  const canSave = !!processedSlots && !!selectedEntry && saveStatus !== 'saved'

  return (
    <div className="fit-single">

      {/* Upload zone — chỉ hiển thị khi chưa có file */}
      {!file && (
        <div
          className={`fit-upload-zone${isDrag ? ' fit-upload-zone--drag' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="fit-upload-icon">🖼</div>
          <div className="fit-upload-label">Kéo thả ảnh vải vào đây, hoặc click để chọn file</div>
          <div className="fit-upload-hint">
            Tên file: <code>mãNCC.jpg</code> · <code>mãNCC_master.jpg</code> · <code>mãNCC_slot1.jpg</code> …
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

          {/* Cột trái: preview ảnh gốc */}
          <div className="fit-preview-col">
            <img src={previewUrl} alt={file.name} className="fit-preview-img" />

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <TypeChip type={imageType} />
              <button className="fit-reset-btn" onClick={handleReset}>↺ Chọn lại</button>
            </div>

            {/* Tên file */}
            <div className="fit-card">
              <div className="fit-card-title">Tên file</div>
              <div className="fit-filename">{file.name}</div>
            </div>
          </div>

          {/* Cột phải: NCC + product info + actions */}
          <div className="fit-info-col">

            {/* NCC detection */}
            <div className="fit-card">
              <div className="fit-card-title">Nhận diện mã NCC</div>

              <div className="fit-ncc-row">
                {nccExtracted ? (
                  <span className="fit-ncc-code">{nccExtracted}</span>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Không đọc được từ tên file
                  </span>
                )}
                {matchResult && <StatusBadge status={matchResult.type} />}
              </div>

              {/* Nếu nhiều kết quả → cho chọn */}
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

              {/* Nhập thủ công nếu không tìm được */}
              <div className="fit-ncc-manual">
                <label>Nhập thủ công:</label>
                <input
                  type="text"
                  placeholder="VD: KGF-001"
                  value={nccInput}
                  onChange={(e) => setNccInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                />
                <button className="btn btn-secondary btn-xs" onClick={handleManualSearch}>Tìm</button>
              </div>
            </div>

            {/* Product info */}
            <ProductInfoCard entry={selectedEntry} />

            {/* Không tìm thấy */}
            {matchResult?.type === BATCH_STATUS.NOT_FOUND && (
              <div className="fit-phase-notice">
                Mã NCC <strong>{nccInput || nccExtracted}</strong> chưa có trong Bảng đơn giá.
                Hãy thêm vào Bảng đơn giá trước rồi xử lý lại.
              </div>
            )}

            {/* Action buttons */}
            <div className="fit-card">
              <div className="fit-card-title">Xử lý ảnh</div>

              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                {imageType === 'master'
                  ? 'Sẽ tách ảnh thành 6 slot theo template fabric_6_grid_A (3×2 grid)'
                  : imageType.startsWith('slot_')
                  ? `Sẽ crop + enhance và lưu vào ${SLOT_KEYS.find(s => s.slot === imageType)?.label || imageType}`
                  : 'Sẽ crop vuông + enhance nhẹ và lưu vào Slot 1 (surface_texture)'}
              </div>

              <div className="fit-actions">
                <button
                  className="btn btn-primary btn-xs"
                  disabled={!canProcess}
                  onClick={handleProcess}
                >
                  {processing ? 'Đang xử lý…' : '▶ Xử lý ảnh'}
                </button>

                {processedSlots && (
                  <button
                    className="btn btn-primary btn-xs"
                    disabled={!canSave}
                    onClick={handleSave}
                  >
                    {saveStatus === 'saving' ? 'Đang lưu…' : '💾 Lưu vào thư viện'}
                  </button>
                )}
              </div>

              {/* Gợi ý khi chưa chọn NCC */}
              {!selectedEntry && !!file && (
                <div className="fit-phase-notice">
                  Cần xác nhận mã NCC trước khi lưu.
                </div>
              )}

              {/* Kết quả lưu */}
              {saveStatus === 'saved' && (
                <div className="fit-save-bar">
                  <span className="fit-save-ok">✓ Đã lưu ảnh vào thư viện cho mã {selectedEntry?.maNCC}</span>
                  <button className="fit-reset-btn" onClick={handleReset}>Xử lý ảnh mới</button>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="fit-save-bar">
                  <span className="fit-save-err">✕ Có lỗi khi lưu. Thử lại.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Image Generator — hiển thị khi đã có surface_texture */}
      {processedSlots?.surface_texture && (
        <AIImageGenerator
          selectedEntry={selectedEntry}
          surfaceTextureUrl={processedSlots.surface_texture}
          onSyncToLibrary={onSaveImages}
        />
      )}

      {/* AI text assistant — panel phụ / debug */}
      {file && (
        <AIAssistPanel
          nccCode={selectedEntry?.maNCC || nccExtracted}
          color={selectedEntry?.nhomMau || ''}
          surfaceTextureUrl={processedSlots?.surface_texture || ''}
          scaleMetadata={null}
        />
      )}

    </div>
  )
}
