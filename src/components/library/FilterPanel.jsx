import { useState } from 'react'
import FilterGroup from './FilterGroup'
import './FilterPanel.css'

export default function FilterPanel({ filterGroups, filters, onFilterChange, onClear, hasActive }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="fp-card">
      <div className="fp-header">
        <p className="section-title" style={{ marginBottom: 0 }}>Bộ lọc</p>
        <div className="fp-header-actions">
          {hasActive && (
            <button className="btn btn-ghost fp-clear-btn" onClick={onClear}>
              Xóa lọc
            </button>
          )}
          <button
            className="btn btn-ghost fp-toggle-btn"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? 'Thu gọn' : 'Mở rộng'}
          </button>
        </div>
      </div>
      <div className={`fp-body${mobileOpen ? ' fp-body--open' : ''}`}>
        {filterGroups.length === 0 ? (
          <p className="fp-empty">Không có bộ lọc khả dụng</p>
        ) : (
          filterGroups.map((group) => (
            <FilterGroup
              key={group.key}
              group={group}
              selected={filters[group.key] || []}
              onChange={onFilterChange}
            />
          ))
        )}

      </div>
    </div>
  )
}
