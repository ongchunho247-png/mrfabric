import './ProductLineIntro.css'

export default function ProductLineIntro({ line, count, total }) {
  if (!line) return null
  return (
    <div className="pli-card">
      <div className="pli-header">
        <h1 className="pli-name">{line.name}</h1>
        <span className={`pli-status pli-status--${line.status}`}>
          {line.status === 'active' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
        </span>
      </div>
      <p className="pli-desc">{line.description}</p>
      <div className="pli-meta">
        <div className="pli-meta-item">
          <span className="pli-meta-label">Nhóm sản phẩm</span>
          <span className="pli-meta-value">{line.category}</span>
        </div>
        <div className="pli-meta-item">
          <span className="pli-meta-label">Ứng dụng</span>
          <span className="pli-meta-value">{line.applications.join(', ')}</span>
        </div>
        <div className="pli-meta-item">
          <span className="pli-meta-label">Đang hiển thị</span>
          <span className="pli-meta-value pli-count">
            {count} / {total} mã vật liệu
          </span>
        </div>
      </div>
    </div>
  )
}
