import { useState, useCallback, useMemo } from 'react'
import {
  extractNccCode,
  detectImageType,
  matchNccInPriceTable,
  findColorVariants,
  processSingleImage,
  processMasterImage,
  processSlotImage,
  SLOT_KEYS,
  BATCH_STATUS,
  STATUS_LABEL,
} from '../../../helpers/fabricImageHelpers'
import MultiColorGenerator from './MultiColorGenerator'
import AIAssistPanel from './AIAssistPanel'

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

function ProductInfoCard({ entry }) {
  if (!entry) return null
  return (
    <div className="fit-card">
      <div className="fit-card-title">Thông tin vật liệu</div>
      <InfoRow label="Mã NCC"        value={entry.maNCC} />
      <InfoRow label="Nhà cung cấp"  value={entry.nhaCungCap} />
      <InfoRow label="Cuốn mẫu"      value={entry.tenCuon} />
      <InfoRow label="Dòng sản phẩm" value={entry.dongSanPham} />
      <InfoRow label="Thành phần"    value={entry.thanhPhan} />
      <InfoRow label="Nhóm màu"      value={entry.nhomMau} />
      <InfoRow label="Bề mặt"        value={Array.isArray(entry.beMat) ? entry.beMat.join(', ') : entry.beMat} />
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
  const [baseSurfaceUrl, setBaseSurfaceUrl] = useState(null) // ảnh gốc sau xử lý

  // Tìm tất cả màu variants của mã NCC đã chọn
  const colorVariants = useMemo(() => {
    if (!selectedEntry || !priceTable) return []
    return findColorVariants(selectedEntry.maNCC, priceTable)
  }, [selectedEntry, priceTable])

  function handleFile(f) {
    if (!f) return
    const objectUrl = URL.createObjectURL(f)
    setFile(f)
    setPreviewUrl(objectUrl)
    setBaseSurfaceUrl(null)

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

  function handleManualSearch() {
    const ncc = nccInput.trim()
    if (!ncc) return
    const result = matchNccInPriceTable(ncc, priceTable)
    setMatchResult(result)
    setSelectedEntry(result.type === BATCH_STATUS.FOUND ? result.matches[0] : null)
  }

  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDrag(true) }, [])
  const onDragLeave = useCallback(() => setIsDrag(false), [])
  const onDrop = useCallback((e) => {
    e.preventDefault(); setIsDrag(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceTable])

  // Xử lý ảnh gốc → baseSurfaceUrl (surface_texture chuẩn)
  async function handleProcess() {
    if (!file) return
    setProcessing(true)
    setBaseSurfaceUrl(null)
    try {
      let surface
      if (imageType === 'master') {
        // Master → lấy slot_1 làm base surface
        const slots = await processMasterImage(file)
        surface = slots.surface_texture
      } else if (imageType.startsWith('slot_')) {
        const slots = await processSlotImage(file, imageType)
        surface = slots.surface_texture || Object.values(slots)[0]
      } else {
        surface = await processSingleImage(file)
      }
      setBaseSurfaceUrl(surface)
    } catch (err) {
      console.error('[FIT] Process error:', err)
    } finally {
      setProcessing(false)
    }
  }

  function handleReset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null); setPreviewUrl(null)
    setNccExtracted(''); setNccInput('')
    setImageType('single')
    setMatchResult(null); setSelectedEntry(null)
    setBaseSurfaceUrl(null)
  }

  const canProcess = !!file && !processing

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
          <div className="fit-upload-label">Kéo thả ảnh vải vào đây, hoặc click để chọn file</div>
          <div className="fit-upload-hint">
            Tên file: <code>mãNCC.jpg</code> · <code>mãNCC_master.jpg</code> · <code>mãNCC_slot1.jpg</code>
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

          {/* Cột phải: NCC + xử lý */}
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
                  placeholder="VD: KGF-001"
                  value={nccInput}
                  onChange={(e) => setNccInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                />
                <button className="btn btn-secondary btn-xs" onClick={handleManualSearch}>Tìm</button>
              </div>
            </div>

            <ProductInfoCard entry={selectedEntry} />

            {/* Màu variants tìm được */}
            {colorVariants.length > 1 && (
              <div className="fit-card">
                <div className="fit-card-title">
                  Danh sách màu
                  <span className="fit-mcg-count">{colorVariants.length} màu</span>
                </div>
                <div className="fit-color-chips">
                  {colorVariants.map((cv) => (
                    <span key={cv.maNCC} className="fit-color-chip">
                      {cv.nhomMau || cv.maNCC}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {matchResult?.type === BATCH_STATUS.NOT_FOUND && (
              <div className="fit-phase-notice">
                Mã NCC <strong>{nccInput || nccExtracted}</strong> chưa có trong Bảng đơn giá.
              </div>
            )}

            {/* Xử lý ảnh */}
            <div className="fit-card">
              <div className="fit-card-title">Xử lý ảnh gốc</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                {imageType === 'master'
                  ? 'Tách ảnh master 3×2, lấy slot 1 làm ảnh tham chiếu'
                  : 'Crop vuông + cân sáng + làm nét → ảnh tham chiếu cho AI'}
              </div>
              <div className="fit-actions">
                <button
                  className="btn btn-primary btn-xs"
                  disabled={!canProcess}
                  onClick={handleProcess}
                >
                  {processing ? 'Đang xử lý…' : '▶ Xử lý ảnh'}
                </button>
              </div>
              {baseSurfaceUrl && (
                <div className="fit-surface-preview">
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '8px 0 4px' }}>
                    Ảnh tham chiếu (surface_texture):
                  </div>
                  <img src={baseSurfaceUrl} alt="surface" className="fit-surface-thumb" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MultiColorGenerator — hiện khi đã có surface + NCC hợp lệ */}
      {baseSurfaceUrl && colorVariants.length > 0 && (
        <MultiColorGenerator
          colorVariants={colorVariants}
          baseSurfaceUrl={baseSurfaceUrl}
          onSyncColor={onSaveImages}
        />
      )}

      {/* AI text assistant */}
      {file && (
        <AIAssistPanel
          nccCode={selectedEntry?.maNCC || nccExtracted}
          color={selectedEntry?.nhomMau || ''}
          surfaceTextureUrl={baseSurfaceUrl || ''}
          scaleMetadata={null}
        />
      )}
    </div>
  )
}
