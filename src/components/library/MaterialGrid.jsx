import MaterialCard from './MaterialCard'
import './MaterialGrid.css'

export default function MaterialGrid({ materials, variantGroupsMap, moodboardItems, onCardClick, onSave }) {
  if (materials.length === 0) {
    return (
      <div className="mg-empty">
        <p>Không tìm thấy vật liệu phù hợp.</p>
        <p className="mg-empty-hint">Thử xóa bộ lọc hoặc thay đổi từ khóa tìm kiếm.</p>
      </div>
    )
  }

  const savedCodes = new Set(moodboardItems.map((i) => i.maMrFabric))

  return (
    <div className="mg-grid">
      {materials.map((m) => {
        const variants = m.nhomVatLieu ? (variantGroupsMap?.[m.nhomVatLieu] || null) : null
        return (
          <MaterialCard
            key={m.id}
            material={m}
            variants={variants}
            isSaved={savedCodes.has(m.maMrFabric)}
            onCardClick={onCardClick}
            onSave={onSave}
          />
        )
      })}
    </div>
  )
}
