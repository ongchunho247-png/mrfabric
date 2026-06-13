import { useState } from 'react'
import {
  updateMoodboardStatus,
  clearMoodboard,
} from '../../helpers/moodboardStorage'
import {
  formatForKTS,
  formatForSale,
  formatShortForClient,
  formatAsTable,
  copyToClipboard,
} from '../../helpers/copyFormats'
import MoodboardItem from './MoodboardItem'
import './Moodboard.css'

export default function Moodboard({ items, setItems, onViewDetail, onRemove }) {
  const [toast, setToast] = useState('')

  function handleStatusChange(maMrFabric, status) {
    setItems((prev) => updateMoodboardStatus(prev, maMrFabric, status))
  }

  function handleClearAll() {
    if (window.confirm('Xóa toàn bộ bộ mẫu tư vấn?')) {
      setItems([])
      clearMoodboard()
    }
  }

  async function handleCopy(format) {
    if (items.length === 0) return
    let text = ''
    let msg = ''
    if (format === 'kts') {
      text = formatForKTS(items)
      msg = 'Đã copy nội dung cho KTS / Nội thất'
    } else if (format === 'sale') {
      text = formatForSale(items)
      msg = 'Đã copy nội dung cho Sale tư vấn'
    } else if (format === 'table') {
      text = formatAsTable(items)
      msg = 'Đã copy bảng vật liệu'
    } else {
      text = formatShortForClient(items)
      msg = 'Đã copy nội dung ngắn gửi khách'
    }
    try {
      await copyToClipboard(text)
      setToast(msg)
      setTimeout(() => setToast(''), 3000)
    } catch {
      setToast('Không thể copy – thử lại')
      setTimeout(() => setToast(''), 3000)
    }
  }

  const isEmpty = items.length === 0

  return (
    <div className="mb-card">
      <div className="mb-header">
        <div>
          <p className="section-title" style={{ marginBottom: 2 }}>Bộ mẫu tư vấn</p>
          {!isEmpty && (
            <span className="mb-count">{items.length} mẫu đã lưu</span>
          )}
        </div>
        {!isEmpty && (
          <button className="btn btn-ghost mb-clear-btn" onClick={handleClearAll}>
            Xóa tất cả
          </button>
        )}
      </div>

      {isEmpty ? (
        <p className="mb-empty">
          Chưa có mã vật liệu nào trong bộ mẫu tư vấn. Hãy lưu các mẫu phù hợp để so sánh và gửi tư vấn.
        </p>
      ) : (
        <div className="mb-list">
          {items.map((item) => (
            <MoodboardItem
              key={item.maMrFabric}
              item={item}
              onViewDetail={onViewDetail}
              onRemove={onRemove}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      <div className="mb-copy-section">
        <p className="mb-copy-label">Copy bộ mẫu</p>
        <div className="mb-copy-btns">
          <button
            className="btn btn-secondary"
            onClick={() => handleCopy('kts')}
            disabled={isEmpty}
            title="Copy format chi tiết cho KTS/Nội thất"
          >
            KTS / Nội thất
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleCopy('sale')}
            disabled={isEmpty}
            title="Copy format tư vấn cho Sale"
          >
            Sale tư vấn
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleCopy('client')}
            disabled={isEmpty}
            title="Copy format ngắn gửi khách hàng"
          >
            Gửi khách
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleCopy('table')}
            disabled={isEmpty}
            title="Copy bảng tổng hợp vật liệu (dán vào Notion, Word, Slack...)"
          >
            Bảng vật liệu
          </button>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
