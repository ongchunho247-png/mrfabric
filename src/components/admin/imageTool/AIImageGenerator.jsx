import { useState, useCallback } from 'react'
import { SLOT_KEYS } from '../../../helpers/fabricImageHelpers'

const AI_SLOT_KEYS = SLOT_KEYS.filter((s) => s.slot !== 'slot_1') // slot_2 đến slot_6

const S = { IDLE: 'idle', GENERATING: 'generating', DONE: 'done', ERROR: 'error' }

const PROGRESS_LABELS = {
  slot_2: 'Đang tạo ảnh tay cầm vải…',
  slot_3: 'Đang tạo ảnh sofa…',
  slot_4: 'Đang tạo ảnh rèm…',
  slot_5: 'Đang tạo ảnh thước đo…',
  slot_6: 'Đang tạo ảnh chi tiết…',
}

function initSlots() {
  return Object.fromEntries(
    AI_SLOT_KEYS.map((s) => [s.slot, { status: S.IDLE, imageUrl: null, error: null }]),
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AIImageGenerator({ selectedEntry, surfaceTextureUrl, onSyncToLibrary }) {
  const [slots, setSlots] = useState(initSlots)
  const [globalRunning, setGlobalRunning] = useState(false)
  const [progressMsg, setProgressMsg] = useState(null)
  const [syncStatus, setSyncStatus] = useState(null) // null | 'syncing' | 'synced' | 'error'
  const [syncMsg, setSyncMsg] = useState('')

  function updateSlot(slotKey, updates) {
    setSlots((prev) => ({ ...prev, [slotKey]: { ...prev[slotKey], ...updates } }))
  }

  // Gọi API tạo 1 slot
  const generateSlot = useCallback(
    async (slotKey) => {
      if (!surfaceTextureUrl) return
      updateSlot(slotKey, { status: S.GENERATING, error: null })
      setProgressMsg(PROGRESS_LABELS[slotKey] || `Đang tạo ${slotKey}…`)
      try {
        const res = await fetch('/api/ai/generate-slot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slot: slotKey,
            surfaceTextureUrl,
            nccCode: selectedEntry?.maNCC || '',
            colorName: selectedEntry?.nhomMau || '',
            supplier: selectedEntry?.nhaCungCap || '',
            collection: selectedEntry?.tenCuon || '',
            materialMetadata: {
              thanhPhan: selectedEntry?.thanhPhan || '',
              khoVai: selectedEntry?.khoVai || '',
              beMat: Array.isArray(selectedEntry?.beMat)
                ? selectedEntry.beMat.join(', ')
                : selectedEntry?.beMat || '',
            },
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'Lỗi tạo ảnh AI')
        updateSlot(slotKey, { status: S.DONE, imageUrl: data.imageUrl })
      } catch (err) {
        updateSlot(slotKey, { status: S.ERROR, error: err.message })
      }
    },
    [surfaceTextureUrl, selectedEntry],
  )

  // Tạo tất cả 5 slot AI (tuần tự để tránh rate limit)
  async function handleGenerateAll() {
    if (!surfaceTextureUrl || globalRunning) return
    setGlobalRunning(true)
    setSyncStatus(null)
    // Reset tất cả slot AI về idle
    setSlots(initSlots)
    for (const s of AI_SLOT_KEYS) {
      await generateSlot(s.slot)
    }
    setProgressMsg(null)
    setGlobalRunning(false)
  }

  // Tạo lại 1 slot
  async function handleRegenerateSlot(slotKey) {
    if (globalRunning) return
    setGlobalRunning(true)
    await generateSlot(slotKey)
    setProgressMsg(null)
    setGlobalRunning(false)
  }

  // Đồng bộ vào thư viện chính
  async function handleSync() {
    if (!selectedEntry) {
      setSyncStatus('error')
      setSyncMsg('Chưa xác nhận mã NCC — không thể đồng bộ.')
      return
    }
    const readySlots = AI_SLOT_KEYS.filter((s) => slots[s.slot].status === S.DONE)
    if (readySlots.length === 0) {
      setSyncStatus('error')
      setSyncMsg('Chưa có slot nào được tạo xong.')
      return
    }

    setSyncStatus('syncing')

    // Xây dựng map field → imageUrl
    const imageMap = {}
    // Slot 1: surface_texture từ ảnh thật
    if (surfaceTextureUrl) imageMap.surface_texture = surfaceTextureUrl
    // Slots 2-6: từ AI
    for (const s of readySlots) {
      imageMap[s.field] = slots[s.slot].imageUrl
    }

    try {
      await onSyncToLibrary?.(selectedEntry.maNCC, imageMap)
      setSyncStatus('synced')
      setSyncMsg(`✓ Đã lưu ${Object.keys(imageMap).length} ảnh vào thư viện cho mã ${selectedEntry.maNCC}`)
    } catch (err) {
      setSyncStatus('error')
      setSyncMsg(err.message || 'Lỗi khi lưu vào thư viện.')
    }
  }

  const doneCount = AI_SLOT_KEYS.filter((s) => slots[s.slot].status === S.DONE).length
  const canSync = doneCount > 0 && !!selectedEntry

  return (
    <div className="fit-card fit-aig">
      <div className="fit-card-title">AI tạo ảnh ứng dụng</div>

      {/* Thông tin đầu vào */}
      {!surfaceTextureUrl && (
        <div className="fit-phase-notice">
          Cần xử lý ảnh thật trước để có surface_texture (bấm ▶ Xử lý ảnh ở trên).
        </div>
      )}
      {!selectedEntry && (
        <div className="fit-phase-notice">
          Cần xác nhận mã NCC trước khi tạo ảnh AI (để AI biết thông tin vật liệu).
        </div>
      )}

      {/* Action buttons */}
      <div className="fit-aig-actions">
        <button
          className="btn btn-primary btn-xs"
          disabled={!surfaceTextureUrl || globalRunning}
          onClick={handleGenerateAll}
        >
          {globalRunning ? '⏳ Đang tạo…' : '✦ Tạo bộ 5 ảnh bằng AI'}
        </button>

        {doneCount > 0 && !globalRunning && (
          <button
            className="btn btn-secondary btn-xs"
            disabled={globalRunning}
            onClick={() => {
              setSlots(initSlots)
              setSyncStatus(null)
            }}
          >
            ↺ Tạo lại toàn bộ
          </button>
        )}

        {canSync && (
          <button
            className="btn btn-primary btn-xs"
            disabled={globalRunning || syncStatus === 'syncing' || syncStatus === 'synced'}
            onClick={handleSync}
          >
            {syncStatus === 'syncing' ? '⏳ Đang đồng bộ…'
              : syncStatus === 'synced' ? '✓ Đã đồng bộ'
              : '🔄 Đồng bộ vào thư viện chính'}
          </button>
        )}
      </div>

      {/* Progress message */}
      {progressMsg && <div className="fit-aig-progress">⏳ {progressMsg}</div>}

      {/* Sync result */}
      {syncMsg && (
        <div className={`fit-aig-sync-msg${syncStatus === 'error' ? ' fit-aig-sync-msg--err' : ' fit-aig-sync-msg--ok'}`}>
          {syncMsg}
        </div>
      )}

      {/* 6-slot grid */}
      <div className="fit-slot-grid fit-aig-grid">
        {/* Slot 1: ảnh thật */}
        <AigSlotCell
          label="Slot 1 — Bề mặt vải"
          imageUrl={surfaceTextureUrl}
          status={surfaceTextureUrl ? S.DONE : S.IDLE}
          tag="Ảnh thật"
          tagClass="fit-aig-tag--real"
        />

        {/* Slots 2–6: AI generated */}
        {AI_SLOT_KEYS.map((sk) => {
          const s = slots[sk.slot]
          return (
            <AigSlotCell
              key={sk.slot}
              label={sk.label}
              imageUrl={s.imageUrl}
              status={s.status}
              error={s.error}
              tag="AI"
              tagClass="fit-aig-tag--ai"
              onRegenerate={s.status !== S.GENERATING ? () => handleRegenerateSlot(sk.slot) : null}
              disabled={globalRunning}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Sub-component: 1 ô trong lưới ────────────────────────────────────────────

function AigSlotCell({ label, imageUrl, status, error, tag, tagClass, onRegenerate, disabled }) {
  return (
    <div className="fit-slot-item fit-aig-cell">
      <div className="fit-aig-cell-header">
        <span className="fit-slot-label">{label}</span>
        {imageUrl && <span className={`fit-aig-tag ${tagClass}`}>{tag}</span>}
      </div>

      {imageUrl ? (
        <img src={imageUrl} alt={label} className="fit-slot-img" />
      ) : status === S.GENERATING ? (
        <div className="fit-slot-ph fit-aig-ph--gen">⏳ Đang tạo…</div>
      ) : status === S.ERROR ? (
        <div className="fit-slot-ph fit-aig-ph--err">✕ Lỗi tạo ảnh</div>
      ) : (
        <div className="fit-slot-ph">Chưa tạo</div>
      )}

      {error && (
        <div className="fit-aig-cell-error" title={error}>
          {error.length > 80 ? error.slice(0, 80) + '…' : error}
        </div>
      )}

      {onRegenerate && (
        <button
          className="fit-reset-btn"
          onClick={onRegenerate}
          disabled={disabled}
          style={{ marginTop: 4 }}
        >
          ↺ Tạo lại
        </button>
      )}
    </div>
  )
}
