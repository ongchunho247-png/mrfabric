import { useState, useCallback } from 'react'
import { SLOT_KEYS, downloadImageAs } from '../../../helpers/fabricImageHelpers'

const S = { IDLE: 'idle', GENERATING: 'generating', DONE: 'done', ERROR: 'error' }

const APP_SLOT_KEYS = SLOT_KEYS.filter((s) => s.slot !== 'slot_1') // slots 2, 3, 4

const SLOT_PROGRESS = {
  slot_1: 'Tạo bề mặt vải…',
  slot_2: 'Tạo ảnh cận chất liệu…',
  slot_3: 'Tạo ảnh không gian gần (~1m)…',
  slot_4: 'Tạo ảnh ruler tỉ lệ…',
}

// Giá ước tính USD per image (gpt-image-1, 1024×1024)
const QUALITY_PRICE = { low: 0.011, medium: 0.042, high: 0.167 }
const QUALITY_LABEL = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' }

// Default quality per slot
const DEFAULT_QUALITIES = { slot_1: 'medium', slot_2: 'medium', slot_3: 'low', slot_4: 'low' }

// ── QualityCard: chọn phân giải per slot + hiển thị chi phí ─────────────────
function QualityCard({ qualities, onChange, colorCount }) {
  const costPerSet = SLOT_KEYS.reduce((sum, sk) => sum + (QUALITY_PRICE[qualities[sk.slot]] || 0), 0)
  const costPerGroup = colorCount > 1
    ? costPerSet + (colorCount - 1) * (QUALITY_PRICE[qualities['slot_1']] + QUALITY_PRICE[qualities['slot_2']] + QUALITY_PRICE[qualities['slot_3']] + QUALITY_PRICE[qualities['slot_4']])
    : costPerSet

  return (
    <div className="fit-card" style={{ marginBottom: 12 }}>
      <div className="fit-card-title">Chế độ phân giải ảnh</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th style={{ textAlign: 'left', padding: '4px 0', fontWeight: 600 }}>Slot</th>
            <th style={{ padding: '4px 8px' }}>Thấp<br /><span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>$0.011</span></th>
            <th style={{ padding: '4px 8px' }}>Trung bình<br /><span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>$0.042</span></th>
            <th style={{ padding: '4px 8px' }}>Cao<br /><span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>$0.167</span></th>
          </tr>
        </thead>
        <tbody>
          {SLOT_KEYS.map((sk) => (
            <tr key={sk.slot} style={{ borderBottom: '1px solid var(--color-border-light, #f0f0f0)' }}>
              <td style={{ padding: '5px 0' }}>
                <span style={{ fontWeight: 500 }}>{sk.slot.replace('slot_', 'Slot ')}</span>
                <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>{sk.label}</span>
              </td>
              {['low', 'medium', 'high'].map((q) => (
                <td key={q} style={{ textAlign: 'center', padding: '5px 8px' }}>
                  <input
                    type="radio"
                    name={`quality-${sk.slot}`}
                    checked={qualities[sk.slot] === q}
                    onChange={() => onChange(sk.slot, q)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 10, fontSize: '0.82rem', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span>Chi phí/bộ: <strong>${costPerSet.toFixed(3)}</strong></span>
        {colorCount > 1 && (
          <span>Toàn nhóm ({colorCount} màu): <strong>${costPerGroup.toFixed(3)}</strong></span>
        )}
        <span style={{ color: 'var(--color-text-muted)' }}>≈ ${5 / costPerSet | 0} bộ/$5</span>
      </div>
    </div>
  )
}

function initColorData(colorVariants) {
  return Object.fromEntries(
    colorVariants.map((cv) => [
      cv.maNCC,
      Object.fromEntries(
        SLOT_KEYS.map((s) => [s.slot, { status: S.IDLE, imageUrl: null, error: null }]),
      ),
    ]),
  )
}

function compressDataUrl(dataUrl, maxDim = 600, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MultiColorGenerator({ colorVariants, baseSurfaceUrl, baseNcc, scaleMetadata, fabricGrain, productType, slotTemplate, onSyncColor }) {
  const [colorData, setColorData] = useState(() => initColorData(colorVariants))
  const [globalRunning, setGlobalRunning] = useState(false)
  const [activeColor, setActiveColor] = useState(null)
  const [colorProgress, setColorProgress] = useState({})
  const [syncStatuses, setSyncStatuses] = useState({})
  const [syncMsgs, setSyncMsgs] = useState({})
  const [slotQualities, setSlotQualities] = useState(DEFAULT_QUALITIES)

  function setSlotQuality(slotKey, quality) {
    setSlotQualities((prev) => ({ ...prev, [slotKey]: quality }))
  }

  function updateSlot(maNCC, slotKey, updates) {
    setColorData((prev) => ({
      ...prev,
      [maNCC]: {
        ...prev[maNCC],
        [slotKey]: { ...prev[maNCC][slotKey], ...updates },
      },
    }))
  }

  function setColorProg(maNCC, msg) {
    setColorProgress((prev) => ({ ...prev, [maNCC]: msg }))
  }

  // ── Tạo surface_texture màu mới ─────────────────────────────────────────
  const generateSurface = useCallback(
    async (colorEntry) => {
      updateSlot(colorEntry.maNCC, 'slot_1', { status: S.GENERATING, error: null })

      // Màu gốc: dùng generate-slot (slot_1) để làm sạch thước đo khỏi ảnh thật
      // Prompt slot_1 đã yêu cầu AI xóa thước — AI giữ nguyên pattern + màu gốc
      if (baseNcc && colorEntry.maNCC === baseNcc) {
        setColorProg(colorEntry.maNCC, 'Làm sạch bề mặt vải (xóa thước đo)…')
        try {
          const res = await fetch('/api/ai/generate-slot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slot: 'slot_1',
              surfaceTextureUrl: baseSurfaceUrl,
              nccCode: colorEntry.maNCC,
              colorName: colorEntry.nhomMau || '',
              targetColor: { name: colorEntry.nhomMau || colorEntry.maNCC, hex: null },
              supplier: colorEntry.nhaCungCap || '',
              collection: colorEntry.tenCuon || '',
              scaleMetadata: scaleMetadata || null,
              productType: productType || null,
              quality: slotQualities['slot_1'] || 'medium',
              materialMetadata: {
                thanhPhan: colorEntry.thanhPhan || '',
                khoVai: colorEntry.khoVai || '',
                beMat: Array.isArray(colorEntry.beMat) ? colorEntry.beMat.join(', ') : colorEntry.beMat || '',
                grainDirection: fabricGrain || '',
              },
            }),
          })
          const data = await res.json()
          if (!res.ok || !data.ok) throw new Error(data.error || 'Lỗi tạo slot_1')
          updateSlot(colorEntry.maNCC, 'slot_1', { status: S.DONE, imageUrl: data.imageUrl })
          return { imageUrl: data.imageUrl, fabricAnalysis: data.fabricAnalysis || null }
        } catch (err) {
          // Fallback về ảnh gốc nếu API lỗi
          console.warn('[MCG] generate-slot slot_1 thất bại, fallback ảnh gốc:', err.message)
          updateSlot(colorEntry.maNCC, 'slot_1', { status: S.ERROR, error: err.message })
          return { imageUrl: baseSurfaceUrl, fabricAnalysis: null }
        }
      }

      // Màu biến thể: recolor surface sang màu mới
      setColorProg(colorEntry.maNCC, SLOT_PROGRESS.slot_1)
      const targetColor = {
        name: colorEntry.nhomMau || colorEntry.maNCC,
        hex: null,
      }
      try {
        const res = await fetch('/api/ai/recolor-surface', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            surfaceTextureUrl: baseSurfaceUrl,
            targetColor,
            nccCode: colorEntry.maNCC,
            supplier: colorEntry.nhaCungCap || '',
            collection: colorEntry.tenCuon || '',
            scaleMetadata: scaleMetadata || null,
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'Lỗi tạo surface')
        updateSlot(colorEntry.maNCC, 'slot_1', { status: S.DONE, imageUrl: data.imageUrl })
        return { imageUrl: data.imageUrl, fabricAnalysis: data.fabricAnalysis || null }
      } catch (err) {
        updateSlot(colorEntry.maNCC, 'slot_1', { status: S.ERROR, error: err.message })
        return { imageUrl: null, fabricAnalysis: null }
      }
    },
    [baseSurfaceUrl, baseNcc, scaleMetadata, productType],
  )

  // ── Tạo 1 slot ứng dụng (slot_2–slot_6) ─────────────────────────────────
  const generateAppSlot = useCallback(
    async (colorEntry, slotKey, surfaceRef, cachedFabricAnalysis) => {
      const targetColor = { name: colorEntry.nhomMau || colorEntry.maNCC, hex: null }
      updateSlot(colorEntry.maNCC, slotKey, { status: S.GENERATING, error: null })
      setColorProg(colorEntry.maNCC, SLOT_PROGRESS[slotKey] || `Tạo ${slotKey}…`)
      try {
        const res = await fetch('/api/ai/generate-slot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slot: slotKey,
            surfaceTextureUrl: surfaceRef,
            nccCode: colorEntry.maNCC,
            colorName: colorEntry.nhomMau || '',
            targetColor,
            supplier: colorEntry.nhaCungCap || '',
            collection: colorEntry.tenCuon || '',
            scaleMetadata: scaleMetadata || null,
            productType: productType || null,
            quality: slotQualities[slotKey] || 'medium',
            fabricAnalysis: cachedFabricAnalysis || null,
            materialMetadata: {
              thanhPhan: colorEntry.thanhPhan || '',
              khoVai: colorEntry.khoVai || '',
              beMat: Array.isArray(colorEntry.beMat)
                ? colorEntry.beMat.join(', ')
                : colorEntry.beMat || '',
              grainDirection: fabricGrain || '',
            },
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'Lỗi tạo ảnh AI')
        updateSlot(colorEntry.maNCC, slotKey, { status: S.DONE, imageUrl: data.imageUrl })
      } catch (err) {
        updateSlot(colorEntry.maNCC, slotKey, { status: S.ERROR, error: err.message })
      }
    },
    [scaleMetadata, productType, fabricGrain],
  )

  // ── Tạo đầy đủ 6 slot cho 1 màu ─────────────────────────────────────────
  async function generateColor(colorEntry) {
    setActiveColor(colorEntry.maNCC)
    // Bước 1: tạo surface màu mới (slot_1) — nhận về fabricAnalysis để tái sử dụng
    const { imageUrl: coloredSurface, fabricAnalysis: cachedAnalysis } = await generateSurface(colorEntry)
    // Dùng surface màu mới làm tham chiếu; nếu thất bại dùng ảnh gốc
    const surfaceRef = coloredSurface || baseSurfaceUrl
    // Bước 2: tạo 5 slot ứng dụng tuần tự — truyền fabricAnalysis đã có, tiết kiệm 5 GPT-4o calls
    for (const sk of APP_SLOT_KEYS) {
      await generateAppSlot(colorEntry, sk.slot, surfaceRef, cachedAnalysis)
    }
    setColorProg(colorEntry.maNCC, '')
    setActiveColor(null)
  }

  // ── Tạo toàn bộ (tất cả màu, tuần tự) ───────────────────────────────────
  async function handleGenerateAll() {
    if (!baseSurfaceUrl || globalRunning) return
    setGlobalRunning(true)
    // Reset tất cả về idle
    setColorData(initColorData(colorVariants))
    setSyncStatuses({})
    setSyncMsgs({})
    for (const cv of colorVariants) {
      await generateColor(cv)
    }
    setGlobalRunning(false)
  }

  // ── Tạo lại toàn bộ cho 1 màu ────────────────────────────────────────────
  async function handleGenerateColor(colorEntry) {
    if (globalRunning) return
    setGlobalRunning(true)
    // Reset slots của màu này về idle
    setColorData((prev) => ({
      ...prev,
      [colorEntry.maNCC]: Object.fromEntries(
        SLOT_KEYS.map((s) => [s.slot, { status: S.IDLE, imageUrl: null, error: null }]),
      ),
    }))
    setSyncStatuses((prev) => ({ ...prev, [colorEntry.maNCC]: null }))
    setSyncMsgs((prev) => ({ ...prev, [colorEntry.maNCC]: '' }))
    await generateColor(colorEntry)
    setGlobalRunning(false)
  }

  // ── Tạo lại 1 slot trong 1 màu ───────────────────────────────────────────
  async function handleRegenerateSlot(colorEntry, slotKey) {
    if (globalRunning) return
    setGlobalRunning(true)
    setActiveColor(colorEntry.maNCC)
    if (slotKey === 'slot_1') {
      const coloredSurface = await generateSurface(colorEntry)
      // Nếu tạo lại slot_1, cũng cần cập nhật reference cho các slot đã done
      // (không tự động regenerate nhưng surface mới sẽ dùng lần generate tiếp theo)
      if (coloredSurface) {
        // Xoá các slot 2-6 đã dùng surface cũ để tránh nhầm lẫn
        // (optional: giữ nguyên để user quyết định)
      }
    } else {
      const currentSurface = colorData[colorEntry.maNCC]?.slot_1?.imageUrl || baseSurfaceUrl
      await generateAppSlot(colorEntry, slotKey, currentSurface)
    }
    setColorProg(colorEntry.maNCC, '')
    setActiveColor(null)
    setGlobalRunning(false)
  }

  // ── Đồng bộ 1 màu vào thư viện ───────────────────────────────────────────
  async function handleSyncColor(colorEntry) {
    const slots = colorData[colorEntry.maNCC]
    const doneSlots = SLOT_KEYS.filter((s) => slots[s.slot].status === S.DONE)
    if (doneSlots.length === 0) {
      setSyncStatuses((prev) => ({ ...prev, [colorEntry.maNCC]: 'error' }))
      setSyncMsgs((prev) => ({ ...prev, [colorEntry.maNCC]: 'Chưa có slot nào được tạo xong.' }))
      return
    }
    setSyncStatuses((prev) => ({ ...prev, [colorEntry.maNCC]: 'syncing' }))
    setSyncMsgs((prev) => ({ ...prev, [colorEntry.maNCC]: 'Đang nén và lưu ảnh…' }))
    try {
      const imageMap = {}
      for (const s of doneSlots) {
        imageMap[s.field] = await compressDataUrl(slots[s.slot].imageUrl, 600, 0.82)
      }
      onSyncColor?.(colorEntry.maNCC, imageMap)
      setSyncStatuses((prev) => ({ ...prev, [colorEntry.maNCC]: 'synced' }))
      setSyncMsgs((prev) => ({
        ...prev,
        [colorEntry.maNCC]: `✓ Đã lưu ${Object.keys(imageMap).length} ảnh cho mã ${colorEntry.maNCC} (${colorEntry.nhomMau})`,
      }))
    } catch (err) {
      setSyncStatuses((prev) => ({ ...prev, [colorEntry.maNCC]: 'error' }))
      setSyncMsgs((prev) => ({ ...prev, [colorEntry.maNCC]: err.message || 'Lỗi khi lưu.' }))
    }
  }

  // ── Đồng bộ tất cả màu đã xong ───────────────────────────────────────────
  async function handleSyncAll() {
    for (const cv of colorVariants) {
      const slots = colorData[cv.maNCC]
      const anyDone = SLOT_KEYS.some((s) => slots[s.slot].status === S.DONE)
      if (anyDone && syncStatuses[cv.maNCC] !== 'synced') {
        await handleSyncColor(cv)
      }
    }
  }

  const totalDone = colorVariants.filter((cv) =>
    SLOT_KEYS.some((s) => colorData[cv.maNCC]?.[s.slot]?.status === S.DONE),
  ).length

  const totalSynced = colorVariants.filter((cv) => syncStatuses[cv.maNCC] === 'synced').length

  return (
    <div className="fit-mcg">
      {/* Header */}
      <div className="fit-mcg-header">
        <div className="fit-mcg-title">
          Tạo bộ ảnh theo màu
          <span className="fit-mcg-count">{colorVariants.length} màu</span>
          {slotTemplate && (
            <span className="fit-mcg-count" style={{ background: '#ede9fe', color: '#5b21b6' }}>
              {slotTemplate.name}
            </span>
          )}
          {!slotTemplate && productType && (
            <span className="fit-mcg-count" style={{ background: '#fee2e2', color: '#991b1b' }}>
              ⚠ Chưa có template cho {productType}
            </span>
          )}
        </div>
        <div className="fit-mcg-summary">
          {totalDone > 0 && (
            <span className="fit-mcg-stat">{totalDone}/{colorVariants.length} màu đã tạo xong</span>
          )}
          {totalSynced > 0 && (
            <span className="fit-mcg-stat fit-mcg-stat--ok">{totalSynced} đã đồng bộ</span>
          )}
        </div>
      </div>

      {!baseSurfaceUrl && (
        <div className="fit-phase-notice">
          Cần xử lý ảnh thật trước (bấm ▶ Xử lý ảnh ở trên) để có ảnh tham chiếu.
        </div>
      )}

      {/* Quality settings */}
      <QualityCard
        qualities={slotQualities}
        onChange={setSlotQuality}
        colorCount={colorVariants.length}
      />

      {/* Global actions */}
      <div className="fit-mcg-actions">
        <button
          className="btn btn-primary btn-xs"
          disabled={!baseSurfaceUrl || globalRunning}
          onClick={handleGenerateAll}
        >
          {globalRunning ? '⏳ Đang tạo…' : `✦ Tạo tất cả ${colorVariants.length} màu`}
        </button>

        {totalDone > 0 && !globalRunning && (
          <button
            className="btn btn-secondary btn-xs"
            onClick={handleSyncAll}
            disabled={globalRunning || totalSynced === totalDone}
          >
            🔄 Đồng bộ tất cả
          </button>
        )}
      </div>

      {/* Per-color cards */}
      <div className="fit-mcg-list">
        {colorVariants.map((cv) => {
          const slots = colorData[cv.maNCC]
          const doneCount = SLOT_KEYS.filter((s) => slots[s.slot].status === S.DONE).length
          const isRunning = activeColor === cv.maNCC
          const syncStatus = syncStatuses[cv.maNCC]
          const syncMsg = syncMsgs[cv.maNCC]
          const prog = colorProgress[cv.maNCC]
          const canSync = doneCount > 0

          const fileBaseName = cv.maMrFabric || cv.maNCC
          const allDoneSlots = SLOT_KEYS.filter((s) => slots[s.slot].status === S.DONE)

          function downloadAll() {
            allDoneSlots.forEach((sk) => {
              const url = slots[sk.slot].imageUrl
              if (url) downloadImageAs(url, `${fileBaseName}_${sk.slot}.jpg`)
            })
          }

          return (
            <div key={cv.maNCC} className={`fit-color-card${isRunning ? ' fit-color-card--active' : ''}`}>
              {/* Color card header */}
              <div className="fit-color-header">
                <div className="fit-color-info">
                  <span className="fit-color-name">{cv.nhomMau || cv.maNCC}</span>
                  <span className="fit-color-code">{cv.maNCC}</span>
                  {cv.maMrFabric && (
                    <span className="fit-color-code" style={{ color: 'var(--color-accent)' }}>
                      {cv.maMrFabric}
                    </span>
                  )}
                  {!cv.maMrFabric && (
                    <span className="fit-color-code" style={{ color: '#b45309' }}>⚠ chưa có mã MrFabric</span>
                  )}
                  {doneCount > 0 && (
                    <span className="fit-color-done">{doneCount}/4 ảnh</span>
                  )}
                </div>
                <div className="fit-color-actions">
                  <button
                    className="btn btn-secondary btn-xs"
                    disabled={!baseSurfaceUrl || globalRunning}
                    onClick={() => handleGenerateColor(cv)}
                  >
                    {isRunning ? '⏳…' : '✦ Tạo màu này'}
                  </button>
                  {canSync && (
                    <button
                      className="btn btn-primary btn-xs"
                      disabled={globalRunning || syncStatus === 'syncing' || syncStatus === 'synced'}
                      onClick={() => handleSyncColor(cv)}
                    >
                      {syncStatus === 'syncing' ? '⏳…'
                        : syncStatus === 'synced' ? '✓ Đã lưu'
                        : '🔄 Đồng bộ'}
                    </button>
                  )}
                  {allDoneSlots.length > 0 && (
                    <button className="btn btn-secondary btn-xs" onClick={downloadAll}>
                      ⬇ Tải xuống ({allDoneSlots.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Progress */}
              {prog && <div className="fit-color-progress">⏳ {prog}</div>}

              {/* Sync message */}
              {syncMsg && (
                <div className={`fit-color-sync-msg${syncStatus === 'error' ? ' fit-color-sync-msg--err' : ' fit-color-sync-msg--ok'}`}>
                  {syncMsg}
                </div>
              )}

              {/* 6-slot grid */}
              <div className="fit-slot-grid fit-color-grid">
                {SLOT_KEYS.map((sk) => {
                  const slot = slots[sk.slot]
                  // Use template label if available, fallback to SLOT_KEYS label
                  const tplSlot = slotTemplate?.slots?.find((s) => s.key === sk.slot)
                  const slotLabel = tplSlot?.label || sk.label
                  return (
                    <div key={sk.slot} className="fit-slot-item fit-color-cell">
                      <div className="fit-color-cell-hd">
                        <span className="fit-slot-label">{slotLabel}</span>
                        {slot.imageUrl && <span className="fit-aig-tag fit-aig-tag--ai">AI</span>}
                      </div>

                      {slot.imageUrl ? (
                        <>
                          <img src={slot.imageUrl} alt={sk.label} className="fit-slot-img" />
                          <button
                            className="fit-download-slot-btn"
                            onClick={() => downloadImageAs(slot.imageUrl, `${fileBaseName}_${sk.slot}.jpg`)}
                            title={`Tải ${fileBaseName}_${sk.slot}.jpg`}
                          >
                            ⬇
                          </button>
                        </>
                      ) : slot.status === S.GENERATING ? (
                        <div className="fit-slot-ph fit-aig-ph--gen">⏳ Đang tạo…</div>
                      ) : slot.status === S.ERROR ? (
                        <div className="fit-slot-ph fit-aig-ph--err">✕ Lỗi</div>
                      ) : (
                        <div className="fit-slot-ph">Chưa tạo</div>
                      )}

                      {slot.error && (
                        <div className="fit-aig-cell-error" title={slot.error}>
                          {slot.error.length > 60 ? slot.error.slice(0, 60) + '…' : slot.error}
                        </div>
                      )}

                      {slot.status !== S.GENERATING && (
                        <button
                          className="fit-reset-btn"
                          onClick={() => handleRegenerateSlot(cv, sk.slot)}
                          disabled={globalRunning}
                          style={{ marginTop: 4 }}
                        >
                          ↺ Tạo lại
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
