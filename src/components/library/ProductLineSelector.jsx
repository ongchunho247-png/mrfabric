import './ProductLineSelector.css'

export default function ProductLineSelector({ lines, selectedId, onSelect }) {
  return (
    <div className="pls-wrap">
      <p className="section-title">Dòng sản phẩm</p>
      <div className="pls-tags">
        {lines.map((line) => (
          <button
            key={line.id}
            className={`pls-tag${selectedId === line.id ? ' pls-tag--active' : ''}`}
            onClick={() => onSelect(selectedId === line.id ? null : line.id)}
          >
            <span className="pls-hash">#</span>
            <span className="pls-name">{line.shortName}</span>
            <span className="pls-count">{line.materialCount}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
