import { useEffect } from 'react'
import './MaterialCard.css'

function MainImage({ material }) {
  const [error, setError] = useState(false)
  const src = material.images?.surface_texture?.path || material.images?.closeup?.path
  useEffect(() => { setError(false) }, [src])

  return (
    <div className="mc-img-wrap">
      {src && !error ? (
        <img src={src} alt={material.maMrFabric} className="mc-img" onError={() => setError(true)} />
      ) : (
        <div className="mc-img-ph img-placeholder">
          <span>{material.maMrFabric}</span>
        </div>
      )}
    </div>
  )
}

export default function MaterialCard({ material, isSaved, onCardClick, onSave }) {
  function handleSave(e) {
    e.stopPropagation()
    onSave(material)
  }

  return (
    <div className="mc" onClick={() => onCardClick(material)} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onCardClick(material)}>

      {/* Slot 1 only — surface_texture (fallback: closeup) */}
      <MainImage material={material} />

      {/* Body */}
      <div className="mc-body">
        <div className="mc-code">{material.maMrFabric}</div>
        {material.phanKhuc && (
          <div className="mc-phankhuc">{material.phanKhuc}</div>
        )}
      </div>

      <button
        className={`mc-save-btn${isSaved ? ' mc-save-btn--saved' : ''}`}
        onClick={handleSave}
        title={isSaved ? 'Đã lưu vào bộ mẫu' : 'Lưu vào bộ mẫu tư vấn'}
      >
        {isSaved ? '♥' : '♡'}
      </button>
    </div>
  )
}
