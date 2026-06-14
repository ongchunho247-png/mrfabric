import { findColorEntry, findClosestColorEntry } from '../../data/colorGroups'
import './MoodboardItem.css'

function resolveColorName(item) {
  if (item.aiColorHex) return findClosestColorEntry(item.aiColorHex)?.name_en || findColorEntry(item.nhomMau)?.name_en || item.nhomMau
  return findColorEntry(item.nhomMau)?.name_en || item.nhomMau
}

const STATUS_OPTIONS = ['Đề xuất chính', 'Phương án thay thế', 'Cần kiểm tra mẫu thật']

function ImageWithFallback({ src, material }) {
  function handleError(e) {
    e.target.style.display = 'none'
    const ph = e.target.nextSibling
    if (ph) ph.style.display = 'flex'
  }
  return (
    <div className="mbi-img-wrap">
      <img src={src} alt={material.maMrFabric} onError={handleError} className="mbi-img" />
      <div className="mbi-img-ph img-placeholder" style={{ display: 'none' }}>
        <span>{material.maMrFabric}</span>
      </div>
    </div>
  )
}

export default function MoodboardItem({ item, onViewDetail, onRemove, onStatusChange }) {
  const closeupSrc = item.images?.closeup?.path

  return (
    <div className="mbi">
      <ImageWithFallback src={closeupSrc} material={item} />

      <div className="mbi-body">
        <div className="mbi-top">
          <div className="mbi-line">{item.tenDongSanPham}</div>
          <div className="mbi-code">{item.maMrFabric}</div>
        </div>

        <div className="mbi-tags">
          {item.nhomMau && <span className="tag">{resolveColorName(item)}</span>}
          {item.toneMau && <span className="tag">{item.toneMau}</span>}
          {Array.isArray(item.congNang) && item.congNang.slice(0, 2).map((c) => (
            <span key={c} className="tag">{c}</span>
          ))}
          {item.phanKhuc && <span className="tag">{item.phanKhuc}</span>}
        </div>

        <div className="mbi-status-wrap">
          <label className="form-label" style={{ marginBottom: 2 }}>Trạng thái</label>
          <select
            className="form-input mbi-status-select"
            value={item.moodboardStatus || 'Đề xuất chính'}
            onChange={(e) => onStatusChange(item.maMrFabric, e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="mbi-actions">
          <button className="btn btn-secondary mbi-detail-btn" onClick={() => onViewDetail(item)}>
            Xem chi tiết
          </button>
          <button className="btn btn-danger mbi-remove-btn" onClick={() => onRemove(item.maMrFabric)}>
            Xóa
          </button>
        </div>
      </div>
    </div>
  )
}
