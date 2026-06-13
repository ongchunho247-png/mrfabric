import { useState } from 'react'
import { findColorEntry } from '../../data/colorGroups'
import './FilterGroup.css'

export default function FilterGroup({ group, selected, onChange }) {
  const [expanded, setExpanded] = useState(true)
  const activeCount = selected ? selected.length : 0
  const isColorGroup = group.key === 'nhomMau'

  return (
    <div className="fg">
      <button className="fg-header" onClick={() => setExpanded((v) => !v)}>
        <span className="fg-label">
          {group.label}
          {activeCount > 0 && <span className="fg-badge">{activeCount}</span>}
        </span>
        <span className="fg-chevron">{expanded ? '▾' : '▸'}</span>
      </button>
      {expanded && (
        <div className="fg-options">
          {group.options.map((opt) => {
            const checked = selected ? selected.includes(opt) : false
            const colorEntry = isColorGroup ? findColorEntry(opt) : null
            return (
              <label key={opt} className="fg-option">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChange(group.key, opt, e.target.checked)}
                />
                {colorEntry && (
                  <span
                    className="fg-color-dot"
                    style={{ background: colorEntry.hex }}
                    title={colorEntry.name_vi}
                  />
                )}
                <span className="fg-option-text">{opt}</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
