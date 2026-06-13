import { useState } from 'react'
import './RecommendedSetPanel.css'

function SpecRow({ label, value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null
  const display = Array.isArray(value) ? value.join(', ') : value
  return (
    <div className="rsp-row">
      <span className="rsp-label">{label}</span>
      <span className="rsp-value">{display}</span>
    </div>
  )
}

function buildCopyText(items) {
  const header = 'MrFabric - Bộ mẫu vật liệu đề xuất'
  const lines = items.map((m, i) => {
    const parts = [
      `Mã sản phẩm: ${m.maMrFabric || ''}`,
      `Màu sắc: ${m.nhomMau || ''}`,
      `Công năng: ${Array.isArray(m.congNang) ? m.congNang.join(', ') : (m.congNang || '')}`,
      `Khổ: ${m.khoVai || ''}`,
      `Thành phần: ${m.thanhPhan || ''}`,
    ]
    return `${i + 1}. ${parts.join(' / ')}`
  })
  return [header, '', ...lines].join('\n')
}

export default function RecommendedSetPanel({ items }) {
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)

  if (items.length === 0) return null

  function handleCopy() {
    const text = buildCopyText(items)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rsp-wrap">
      <button className="rsp-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="rsp-heading">MrFabric - Bộ mẫu vật liệu đề xuất</span>
        <span className="rsp-count">{items.length}</span>
        <span className="rsp-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="rsp-list">
          <button className="btn btn-ghost rsp-copy-btn" onClick={handleCopy}>
            {copied ? '✓ Đã copy' : '📋 Copy format KTS/Nội thất'}
          </button>

          {items.map((m, i) => (
            <div key={m.maMrFabric} className="rsp-card">
              <div className="rsp-card-head">
                <span className="rsp-num">{i + 1}</span>
                <span className="rsp-code">{m.maMrFabric}</span>
                {m.moodboardStatus && (
                  <span className="rsp-status">{m.moodboardStatus}</span>
                )}
              </div>
              <div className="rsp-fields">
                <SpecRow label="Mã màu" value={m.nhomMau} />
                <SpecRow label="Thành phần" value={m.thanhPhan} />
                <SpecRow label="Khổ" value={m.khoVai} />
                <SpecRow label="Công năng" value={m.congNang} />
                <SpecRow label="Phân khúc" value={m.phanKhuc} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
