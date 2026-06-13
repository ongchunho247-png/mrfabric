import { useState, useEffect } from 'react'
import { findColorEntry } from '../../data/colorGroups'
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

export default function MaterialCard({ material, variants, isSaved, onCardClick, onSave }) {
  const [hoveredVariant, setHoveredVariant] = useState(null)

  function handleSave(e) {
    e.stopPropagation()
    onSave(material)
  }

  const displayMaterial = hoveredVariant || material
  const showVariants = variants && variants.length > 1

  return (
    <div className="mc" onClick={() => onCardClick(material)} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onCardClick(material)}>

      {/* Slot 1 only — surface_texture (fallback: closeup) */}
      <MainImage material={displayMaterial} />

      {/* Color variant dots — right below image frame */}
      {showVariants && (
        <div className="mc-variants" onClick={(e) => e.stopPropagation()}>
          {variants.slice(0, 10).map((v) => {
            const entry = findColorEntry(v.nhomMau)
            return (
              <span
                key={v.id}
                className={`mc-variant-dot${hoveredVariant?.id === v.id ? ' mc-variant-dot--active' : ''}`}
                style={{ background: entry?.hex || '#ccc' }}
                title={entry?.name_en || v.nhomMau || ''}
                onMouseEnter={() => setHoveredVariant(v)}
                onMouseLeave={() => setHoveredVariant(null)}
                onClick={(e) => { e.stopPropagation(); onCardClick(v) }}
              />
            )
          })}
          {variants.length > 10 && (
            <span className="mc-variant-more">+{variants.length - 10}</span>
          )}
        </div>
      )}

      {/* Body */}
      <div className="mc-body">
        <div className="mc-code">{hoveredVariant ? hoveredVariant.maMrFabric : material.maMrFabric}</div>
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
