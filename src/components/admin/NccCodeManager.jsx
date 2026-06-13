import { useState } from 'react'
import { setNccEntry, removeNccCode } from '../../helpers/nccCodeStorage'
import './NccCodeManager.css'

// ── NCC row card with inline code editing ─────────────────────────────────────

function NccCard({ nccName, entry, nccCodes, onUpdate, onDelete, materialCount }) {
  const [editing, setEditing] = useState(false)
  const [draftCode, setDraftCode] = useState('')
  const code = typeof entry === 'string' ? entry : (entry.code || '')

  function handleStartEdit() {
    setDraftCode(code)
    setEditing(true)
  }

  function handleSaveCode() {
    const c = draftCode.trim().toUpperCase()
    if (c.length < 2) return
    onUpdate(setNccEntry(nccCodes, nccName, c, c))
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSaveCode()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <div className="ncm-card">
      <span className="ncm-card-name">{nccName}</span>
      {editing ? (
        <div className="ncm-code-edit-row">
          <input
            className="form-input ncm-code-inline-input"
            value={draftCode}
            onChange={(e) => setDraftCode(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            maxLength={12}
            autoFocus
            placeholder="VD: ORION"
          />
          <button className="ncm-cuon-ok" onClick={handleSaveCode} title="Lưu (Enter)">✓</button>
          <button className="ncm-cuon-del" onClick={() => setEditing(false)} title="Huỷ (Esc)">✕</button>
        </div>
      ) : (
        <button
          className={`ncm-badge ncm-badge--code${!code ? ' ncm-badge--empty' : ''}`}
          onClick={handleStartEdit}
          title="Click để sửa mã nội bộ"
        >
          {code || '+ Mã'}
        </button>
      )}
      {materialCount > 0 && (
        <span className="ncm-card-count">{materialCount} vật liệu</span>
      )}
      <button
        className="btn btn-danger ncm-del-btn"
        onClick={() => onDelete(nccName)}
      >
        Xóa
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NccCodeManager({ nccCodes, onUpdate, allMaterials }) {
  const entries = Object.entries(nccCodes)

  function handleDelete(name) {
    if (window.confirm(`Xóa NCC "${name}"?`)) {
      onUpdate(removeNccCode(nccCodes, name))
    }
  }

  function getMaterialCount(nccName) {
    if (!allMaterials) return 0
    return allMaterials.filter((m) => m.nhaCungCap === nccName).length
  }

  return (
    <div className="ncm-wrap" data-dn-area="Danh mục NCC">
      <div className="ncm-intro">
        <p className="ncm-desc">
          Mỗi NCC cần có <strong>mã nội bộ</strong> để tạo mã MrFabric. Click vào mã để sửa.
          Thêm NCC mới trong phần Bảng đơn giá bên dưới.
        </p>
        <code className="ncm-format">MC – [Mã nội bộ NCC] – [Số cuốn mẫu][Số trang] &nbsp;(VD: MC-ORION-001015)</code>
      </div>

      {entries.length === 0 ? (
        <div className="ncm-empty">
          Chưa có NCC nào. Thêm NCC trong phần Bảng đơn giá bên dưới.
        </div>
      ) : (
        <div className="ncm-list">
          <span className="ncm-list-count">{entries.length} NCC</span>
          {entries.map(([name, entry]) => (
            <NccCard
              key={name}
              nccName={name}
              entry={entry}
              nccCodes={nccCodes}
              onUpdate={onUpdate}
              onDelete={handleDelete}
              materialCount={getMaterialCount(name)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
