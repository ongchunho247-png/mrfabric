import { useState } from 'react'
import { productLines as STATIC_LINES } from '../../data/productLines'
import { COLOR_GROUPS } from '../../data/colorGroups'
import './MaterialForm.css'

// ── Bề mặt vải: multi-select tag field with AI-suggest ────────────────────

function BeMaTField({ value, onChange, fromOcr, customOptions, onAddOption, onRemoveOption }) {
  const [newVal, setNewVal] = useState('')
  // Normalize to array — backward-compat with existing string values
  const current = Array.isArray(value) ? value : (value ? [value] : [])
  const allOpts = customOptions || []

  function handleSelect(opt) {
    const next = current.includes(opt) ? current.filter((o) => o !== opt) : [...current, opt]
    onChange({ target: { name: 'beMat', value: next } })
  }

  function handleAdd() {
    const t = newVal.trim()
    if (!t || allOpts.includes(t)) return
    onAddOption && onAddOption(t)
    if (!current.includes(t)) onChange({ target: { name: 'beMat', value: [...current, t] } })
    setNewVal('')
  }

  function handleRemove(opt) {
    if (current.includes(opt)) onChange({ target: { name: 'beMat', value: current.filter((o) => o !== opt) } })
    onRemoveOption && onRemoveOption(opt)
  }

  return (
    <div className="form-group">
      <label className="form-label">
        Bề mặt
        {fromOcr && current.length > 0 && <span className="mf-ocr-badge">🤖 AI gợi ý</span>}
        {current.length > 0 && <span className="mf-hint"> ({current.length} đã chọn)</span>}
      </label>
      {allOpts.length > 0 && (
        <div className="bemat-opts">
          {allOpts.map((opt) => (
            <span key={opt} className={`bemat-chip-wrap${current.includes(opt) ? ' bemat-chip-wrap--on' : ''}`}>
              <button type="button" className={`bemat-chip${current.includes(opt) ? ' bemat-chip--on' : ''}`} onClick={() => handleSelect(opt)}>{opt}</button>
              <button type="button" className="bemat-chip-rm" onClick={() => handleRemove(opt)} title="Xóa">×</button>
            </span>
          ))}
        </div>
      )}
      <div className="tf-add-wrap">
        <input
          className="form-input tf-new-input"
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          placeholder="Thêm mới..."
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
        />
        {newVal.trim() && (
          <button type="button" className="btn btn-ghost tf-add-btn" onClick={handleAdd}>+ Thêm</button>
        )}
      </div>
    </div>
  )
}

// ── Nhóm màu: dải 20 màu đặc trưng ────────────────────────────────────────

function NhomMauSwatchField({ value, onChange, fromOcr }) {
  const selected = value || ''
  return (
    <div className="form-group">
      <label className="form-label">
        Nhóm màu
        {fromOcr && selected && <span className="mf-ocr-badge">🤖 AI gợi ý</span>}
      </label>
      <div className="nhm-strip">
        {COLOR_GROUPS.map((c) => (
          <button
            key={c.code}
            type="button"
            className={`nhm-swatch${selected === c.code ? ' nhm-swatch--on' : ''}`}
            style={{ background: c.hex }}
            onClick={() => onChange({ target: { name: 'nhomMau', value: selected === c.code ? '' : c.code } })}
            title={c.name_en}
          >
            {selected === c.code && <span className="nhm-check" aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
      {selected && (() => {
        const entry = COLOR_GROUPS.find((c) => c.code === selected)
        return (
          <div className="nhm-selected">
            <span className="nhm-selected-dot" style={{ background: entry?.hex }} />
            <span className="nhm-selected-name">{entry ? entry.name_en : selected}</span>
            <button type="button" className="nhm-clear" onClick={() => onChange({ target: { name: 'nhomMau', value: '' } })}>✕</button>
          </div>
        )
      })()}
    </div>
  )
}

// ── Ảnh sản phẩm: upload / camera / paste clipboard (Note 2) ──────────────

function ProductImageField({ value, onChange }) {
  function compressToBase64(file) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 600
        let w = img.width, h = img.height
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        onChange({ target: { name: 'productImage', value: canvas.toDataURL('image/jpeg', 0.75) } })
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  function handlePaste(e) {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'))
    if (item) compressToBase64(item.getAsFile())
  }

  return (
    <div className="form-group">
      <label className="form-label">
        Ảnh sản phẩm
        <span className="mf-hint"> — nhấn vào ô rồi Ctrl+V để dán</span>
      </label>
      <div className="pimg-zone" tabIndex={0} onPaste={handlePaste}>
        {value ? (
          <>
            <img className="pimg-preview" src={value} alt="Ảnh SP" />
            <button
              type="button"
              className="btn btn-ghost pimg-remove"
              onClick={() => onChange({ target: { name: 'productImage', value: '' } })}
            >
              ✕ Xóa ảnh
            </button>
          </>
        ) : (
          <div className="pimg-placeholder">
            <span className="pimg-placeholder-icon">🖼</span>
            <span className="pimg-placeholder-text">Nhấn vào đây rồi dán ảnh (Ctrl+V)</span>
          </div>
        )}
      </div>
      <div className="pimg-btns">
        <label className="btn btn-ghost pimg-file-btn">
          📁 Chọn từ thư viện
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => compressToBase64(e.target.files[0])} />
        </label>
        <label className="btn btn-ghost pimg-file-btn">
          📷 Chụp ảnh
          <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => compressToBase64(e.target.files[0])} />
        </label>
      </div>
    </div>
  )
}

const PHAN_KHUC_OPTIONS = ['Basic', 'Plus', 'Premium', 'Signature']

// ── Helpers ────────────────────────────────────────────────────────────────

function formatPriceNum(raw) {
  const digits = String(raw || '').replace(/\./g, '').replace(/\D/g, '')
  if (!digits) return ''
  return parseInt(digits, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// ── Field atoms ────────────────────────────────────────────────────────────

function TextField({ label, name, value, onChange, required, placeholder, readOnly, fromOcr, suggestions }) {
  const listId = suggestions?.length ? `tf-${name}-list` : undefined
  return (
    <div className="form-group">
      <label className="form-label">
        {label}{required && ' *'}
        {fromOcr && value && <span className="mf-ocr-badge">📋 Từ nhãn</span>}
      </label>
      <input
        className={`form-input${readOnly ? ' form-input--readonly' : ''}`}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder || ''}
        readOnly={readOnly}
        list={listId}
        autoComplete="off"
      />
      {listId && (
        <datalist id={listId}>
          {suggestions.map((s) => <option key={s} value={s} />)}
        </datalist>
      )}
    </div>
  )
}

function PriceField({ label, name, value, onChange, hint }) {
  function handleChange(e) {
    const formatted = formatPriceNum(e.target.value)
    onChange({ target: { name, value: formatted } })
  }
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {hint && <span className="mf-hint"> {hint}</span>}
      </label>
      <input
        className="form-input"
        name={name}
        value={value || ''}
        onChange={handleChange}
        placeholder="0"
        inputMode="numeric"
      />
    </div>
  )
}

// ── Tên cuốn mẫu: phễu từ Danh mục NCC ────────────────────────────────────

function CollectionField({ value, onChange, nccCollections, hasNcc, fromOcr }) {
  const [isCustomMode, setIsCustomMode] = useState(false)
  const existingHit = nccCollections.includes(value || '')
  const showSelect = hasNcc && nccCollections.length > 0 && !isCustomMode

  function handleSelectChange(e) {
    const v = e.target.value
    if (v === '__new__') { setIsCustomMode(true); onChange({ target: { name: 'collection', value: '' } }) }
    else onChange({ target: { name: 'collection', value: v } })
  }

  const labelEl = (
    <label className="form-label">
      Tên cuốn mẫu
      {fromOcr && value && <span className="mf-ocr-badge">📋 Từ nhãn</span>}
      {hasNcc && nccCollections.length > 0 && !isCustomMode && (
        <span className="mf-hint"> ({nccCollections.length} cuốn trong danh mục)</span>
      )}
      {isCustomMode && hasNcc && nccCollections.length > 0 && <span className="mf-hint"> (cuốn mới)</span>}
    </label>
  )

  if (showSelect) {
    return (
      <div className="form-group">
        {labelEl}
        <select
          className="form-input"
          value={existingHit ? (value || '') : ''}
          onChange={handleSelectChange}
        >
          <option value="">-- Chọn cuốn mẫu --</option>
          {nccCollections.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="__new__">+ Nhập tên mới...</option>
        </select>
      </div>
    )
  }

  return (
    <div className="form-group">
      {labelEl}
      <div className="mf-cat-row">
        <input className="form-input" name="collection" value={value || ''} onChange={onChange} placeholder="VD: Kanvas, Design Linen..." />
        {hasNcc && nccCollections.length > 0 && (
          <button type="button" className="btn btn-ghost mf-cat-back-btn" onClick={() => setIsCustomMode(false)}>
            Chọn có sẵn
          </button>
        )}
      </div>
    </div>
  )
}

// ── Dòng sản phẩm: pill single-select + add/delete custom (Note 1, 4) ─────

function autoTypeCode(name) {
  return name.trim().split(/\s+/).map((w) => w[0] || '').join('').toUpperCase().slice(0, 4)
}

function ProductLinePills({ value, onChange, errors, allProductLines, onAddProductLine, onRemoveProductLine }) {
  const [addMode, setAddMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [userEditedCode, setUserEditedCode] = useState(false)

  const existingCodes = allProductLines.map((l) => l.typeCode)
  const codeConflict = newCode.trim() && existingCodes.includes(newCode.trim().toUpperCase())

  function handleNameChange(e) {
    const name = e.target.value
    setNewName(name)
    if (!userEditedCode) setNewCode(autoTypeCode(name))
  }

  function handleCodeChange(e) {
    setNewCode(e.target.value.toUpperCase())
    setUserEditedCode(true)
  }

  function handleAdd() {
    if (!newName.trim() || !newCode.trim() || codeConflict) return
    onAddProductLine(newName.trim(), newCode.trim())
    setNewName(''); setNewCode(''); setAddMode(false); setUserEditedCode(false)
  }

  return (
    <div className="form-group">
      <label className="form-label">Dòng sản phẩm *</label>
      <div className="tf-tags">
        {allProductLines.map((l) => (
          <div key={l.id} className="tf-tag-item">
            <button
              type="button"
              className={`tf-tag tf-tag--line${value === l.id ? ' tf-tag--on' : ''}`}
              onClick={() => onChange({ target: { name: 'productLineId', value: value === l.id ? '' : l.id } })}
            >
              {l.shortName}
              <span className="tf-tag-code"> [{l.typeCode}]</span>
            </button>
            <button type="button" className="tf-tag-rmv" onClick={() => onRemoveProductLine(l.id)} title={`Xóa "${l.shortName}"`}>×</button>
          </div>
        ))}
      </div>

      {addMode ? (
        <div className="tf-add-wrap">
          <input
            className="form-input tf-new-input"
            value={newName}
            onChange={handleNameChange}
            placeholder="Tên dòng SP..."
            autoFocus
          />
          <input
            className={`form-input tf-code-input${codeConflict ? ' form-input--error' : ''}`}
            value={newCode}
            onChange={handleCodeChange}
            placeholder="Mã (VD: JQ)"
            maxLength={4}
            title="2–4 ký tự viết hoa, duy nhất"
          />
          <button type="button" className="btn btn-primary tf-add-btn" onClick={handleAdd} disabled={!newName.trim() || !newCode.trim() || codeConflict}>✓</button>
          <button type="button" className="btn btn-ghost tf-add-btn" onClick={() => { setAddMode(false); setNewName(''); setNewCode(''); setUserEditedCode(false) }}>✕</button>
        </div>
      ) : (
        <button type="button" className="btn btn-ghost tf-add-btn" style={{ marginTop: 6 }} onClick={() => setAddMode(true)}>
          + Thêm dòng SP
        </button>
      )}
      {errors?.productLineId && <span className="mf-error">{errors.productLineId}</span>}
    </div>
  )
}

// ── Nhóm màu: color code pill (Note 5) ────────────────────────────────────

function NhomMauPills({ value, onChange, customColors, onAddColor, onRemoveColor, fromOcr }) {
  const [addMode, setAddMode] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')

  // Only user-added colors shown as pills (Note 3: no predefined defaults)
  const displayColors = customColors || []
  // COLOR_GROUPS not yet added — shown as quick-add suggestions
  const suggestions = COLOR_GROUPS.filter((c) => !displayColors.some((dc) => dc.code === c.code))

  // Lookup in both standard + custom for label/OCR matching
  const allForLookup = [...COLOR_GROUPS, ...displayColors]
  const matched = allForLookup.find((c) => c.code === (value || '').toUpperCase())
  const isUnknown = value && !matched

  const codeConflict = newCode.trim() && displayColors.some((c) => c.code === newCode.trim().toUpperCase())

  function handleSelect(code) {
    onChange({ target: { name: 'nhomMau', value: value === code ? '' : code } })
  }

  function handleQuickAdd(colorEntry) {
    onAddColor(colorEntry.code, colorEntry.name_en)
    onChange({ target: { name: 'nhomMau', value: colorEntry.code } })
    setAddMode(false)
  }

  function handleAdd() {
    const code = newCode.trim().toUpperCase()
    const name = newName.trim()
    if (!code || !name || codeConflict) return
    onAddColor(code, name)
    onChange({ target: { name: 'nhomMau', value: code } })
    setNewCode(''); setNewName(''); setAddMode(false)
  }

  return (
    <div className="form-group">
      <label className="form-label">
        Nhóm màu
        {fromOcr && value && <span className="mf-ocr-badge">📋 Từ nhãn</span>}
        {matched && <span className="mf-hint"> — {matched.name_en || matched.name_vi}</span>}
        {isUnknown && (
          <span className="mf-hint mf-color-unknown"> ← AI: "{value}" — chọn mã bên dưới</span>
        )}
      </label>

      {displayColors.length > 0 && (
        <div className="tf-tags">
          {displayColors.map((c) => (
            <div key={c.code} className="tf-tag-item">
              <button
                type="button"
                className={`tf-tag tf-tag--color${value === c.code ? ' tf-tag--on' : ''}`}
                onClick={() => handleSelect(c.code)}
              >
                <span className="tf-color-name">{c.name_en || c.name_vi}</span>
              </button>
              <button type="button" className="tf-tag-rmv" onClick={() => onRemoveColor(c.code)} title={`Xóa màu "${c.name_en || c.name_vi}"`}>×</button>
            </div>
          ))}
        </div>
      )}

      {addMode ? (
        <div className="mf-color-add-panel">
          {suggestions.length > 0 && (
            <div className="mf-color-suggestions">
              <span className="mf-hint">Thêm nhanh:</span>
              {suggestions.map((c) => (
                <button key={c.code} type="button" className="btn btn-ghost mf-color-suggest-btn" onClick={() => handleQuickAdd(c)}>
                  {c.name_en}
                </button>
              ))}
            </div>
          )}
          <div className="tf-add-wrap">
            <input
              className={`form-input tf-code-input${codeConflict ? ' form-input--error' : ''}`}
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="Mã"
              maxLength={3}
              autoFocus
            />
            <input
              className="form-input tf-new-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Tên màu"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            />
            <button type="button" className="btn btn-primary tf-add-btn" onClick={handleAdd} disabled={!newCode.trim() || !newName.trim() || codeConflict}>✓</button>
            <button type="button" className="btn btn-ghost tf-add-btn" onClick={() => { setAddMode(false); setNewCode(''); setNewName('') }}>✕</button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-ghost tf-add-btn" style={{ marginTop: displayColors.length > 0 ? 6 : 0 }} onClick={() => setAddMode(true)}>
          + Thêm màu
        </button>
      )}
    </div>
  )
}

// ── Hashtag chip field — free-form, with AI-suggest badge ─────────────────

function HashtagField({ value, onChange, fromOcr }) {
  const [newTag, setNewTag] = useState('')
  const chips = Array.isArray(value) ? value : []

  function handleRemove(tag) {
    onChange({ target: { name: 'hashtag', value: chips.filter((t) => t !== tag) } })
  }

  function handleAdd() {
    const t = newTag.trim().replace(/^#+/, '')
    if (!t || chips.includes(t)) { setNewTag(''); return }
    onChange({ target: { name: 'hashtag', value: [...chips, t] } })
    setNewTag('')
  }

  return (
    <div className="form-group">
      <label className="form-label">
        Hashtag
        {fromOcr && chips.length > 0 && <span className="mf-ocr-badge">🤖 AI gợi ý</span>}
      </label>
      {chips.length > 0 && (
        <div className="hf-chips">
          {chips.map((tag) => (
            <span key={tag} className="hf-chip">
              #{tag}
              <button type="button" className="hf-chip-rm" onClick={() => handleRemove(tag)}>×</button>
            </span>
          ))}
        </div>
      )}
      <div className="tf-add-wrap">
        <input
          className="form-input tf-new-input"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Thêm hashtag..."
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
        />
        {newTag.trim() && (
          <button type="button" className="btn btn-ghost tf-add-btn" onClick={handleAdd}>+ Thêm</button>
        )}
      </div>
    </div>
  )
}

// ── Hashtag tag field: toggle + add + delete (Notes 2, 3) ──────────────────

function TagField({ label, name, value, onChange, availableTags, onAddTag, onRemoveTag }) {
  const [newTag, setNewTag] = useState('')
  const current = Array.isArray(value) ? value : []

  function handleToggle(tag) {
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    onChange({ target: { name, value: next } })
  }

  function handleAdd() {
    const t = newTag.trim()
    if (!t) return
    if (!current.includes(t)) onChange({ target: { name, value: [...current, t] } })
    onAddTag(name, t)
    setNewTag('')
  }

  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {current.length > 0 && <span className="mf-hint"> ({current.length} đã chọn)</span>}
      </label>
      {(availableTags || []).length === 0 ? (
        <div className="tf-empty-hint">Chưa có tùy chọn — nhập và nhấn + Thêm để tạo mới</div>
      ) : (
        <div className="tf-tags">
          {(availableTags || []).map((t) => (
            <div key={t} className="tf-tag-item">
              <button
                type="button"
                className={`tf-tag${current.includes(t) ? ' tf-tag--on' : ''}`}
                onClick={() => handleToggle(t)}
              >
                {t}
              </button>
              {onRemoveTag && (
                <button type="button" className="tf-tag-rmv" onClick={() => onRemoveTag(name, t)} title={`Xóa "${t}"`}>×</button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="tf-add-wrap">
        <input
          className="form-input tf-new-input"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Thêm mới..."
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
        />
        {newTag.trim() && (
          <button type="button" className="btn btn-ghost tf-add-btn" onClick={handleAdd}>+ Thêm</button>
        )}
      </div>
    </div>
  )
}

// ── Chú thích cấu trúc mã MrFabric ────────────────────────────────────────

function MrFabricCodeNote({ code, data }) {
  if (!code || !code.startsWith('MC-')) return null
  const parts = code.split('-')
  if (parts.length < 3) return null

  const catPage = parts[2] || ''
  const segs = [
    { val: parts[0], hint: 'MrFabric' },
    { val: parts[1], hint: data.nhaCungCap || 'NCC' },
    { val: catPage.slice(0, 3), hint: `Cat: ${data.catalogueNum || '?'}` },
    { val: catPage.slice(3, 6), hint: `Trang: ${data.soTrang || '?'}` },
  ]

  return (
    <div className="mf-code-note">
      {segs.map((s, i) => (
        <span key={i} className="mf-code-seg">
          <span className="mf-code-seg-chip">{s.val}</span>
          <span className="mf-code-seg-hint">{s.hint}</span>
          {i < segs.length - 1 && <span className="mf-code-seg-dash" aria-hidden="true">–</span>}
        </span>
      ))}
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────

function SectionBlock({ accent, icon, title, subtitle, children }) {
  return (
    <div className={`mf-section mf-section--${accent}`}>
      <div className="mf-section-header">
        <span className="mf-section-icon">{icon}</span>
        <div>
          <div className="mf-section-title">{title}</div>
          {subtitle && <div className="mf-section-subtitle">{subtitle}</div>}
        </div>
      </div>
      <div className="mf-section-body">{children}</div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function MaterialForm({
  data,
  onChange,
  errors,
  ocrFilledFields,
  nccCatalogues,
  nccCollections,
  nccNames,
  variantGroups,
  nccMaCodes,
  maNccDuplicate,
  khoVaiSuggestions,
  thanhPhanSuggestions,
  tieuChuanSuggestions,
  selectedNccCode,
  nccSectionDone,
  onConfirmNcc,
  onEditNcc,
  tags,
  onAddTag,
  onRemoveTag,
  allProductLines,
  onAddProductLine,
  onRemoveProductLine,
  customColors,
  onAddColor,
  onRemoveColor,
  onChangeProductImage,
}) {
  function handleChange(e) {
    const { name, value } = e.target
    onChange(name, value)
  }

  function isFromOcr(fieldName) {
    return ocrFilledFields?.includes(fieldName) && !!(Array.isArray(data[fieldName]) ? data[fieldName].length : data[fieldName])
  }

  const hasNcc = !!data.nhaCungCap
  const mergedLines = allProductLines || STATIC_LINES

  return (
    <div className="mf-form">

      {/* ── SECTION 1: THÔNG TIN NCC ──────────────────────────────── */}
      <SectionBlock accent="ncc" icon="🏷️" title="Thông tin NCC" subtitle="Trích xuất từ nhãn sản phẩm — chỉ Admin thấy">

        <div className="form-group">
          <label className="form-label">Nhà cung cấp *</label>
          {nccNames && nccNames.length > 0 ? (
            <select
              className="form-input"
              value={data.nhaCungCap || ''}
              onChange={(e) => onChange('nhaCungCap', e.target.value)}
              disabled={nccSectionDone}
            >
              <option value="">-- Chọn nhà cung cấp --</option>
              {nccNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          ) : (
            <div className="mf-ncc-empty">
              Chưa có NCC nào. Vào tab <strong>Bảng đơn giá</strong> để thêm NCC trước.
            </div>
          )}
          {selectedNccCode && (
            <div className="mf-ncc-code-row">
              Mã nội bộ: <code className="mf-ncc-code-badge">{selectedNccCode}</code>
              <span className="mf-hint"> — sẽ dùng trong mã MrFabric</span>
            </div>
          )}
        </div>

        <div className="mf-grid">
          {/* Tên cuốn mẫu TRƯỚC Mã NCC (Note 5 prev) */}
          <CollectionField
            value={data.collection}
            onChange={handleChange}
            nccCollections={nccCollections || []}
            hasNcc={hasNcc}
            fromOcr={isFromOcr('collection')}
          />

          <TextField
            label="Mã NCC" name="maNCC" value={data.maNCC} onChange={handleChange}
            placeholder="Mã sản phẩm của NCC (VD: A15-8, KC-03)" fromOcr={isFromOcr('maNCC')}
            suggestions={nccMaCodes}
          />
          {maNccDuplicate && (
            <p className="mf-hint mf-hint--warn">⚠ Mã NCC này đã có trong thư viện</p>
          )}

          <TextField
            label="Nhóm biến thể" name="nhomVatLieu" value={data.nhomVatLieu} onChange={handleChange}
            placeholder="VD: GR-001 (tự điền từ mã NCC)"
            suggestions={variantGroups}
          />

          <TextField label="Khổ" name="khoVai" value={data.khoVai} onChange={handleChange} placeholder="VD: 280cm" fromOcr={isFromOcr('khoVai')} suggestions={khoVaiSuggestions} />
          <TextField label="Thành phần" name="thanhPhan" value={data.thanhPhan} onChange={handleChange} placeholder="VD: 100% Polyester" fromOcr={isFromOcr('thanhPhan')} suggestions={thanhPhanSuggestions} />
          <TextField label="Tiêu chuẩn kỹ thuật" name="tieuChuan" value={data.tieuChuan} onChange={handleChange} placeholder="VD: OEKO-TEX, Interior fabric" fromOcr={isFromOcr('tieuChuan')} suggestions={tieuChuanSuggestions} />

          <div className="form-group">
            <label className="form-label">Leadtime<span className="mf-hint"> (số ngày nhập về)</span></label>
            <div className="mf-leadtime-row">
              <input className="form-input mf-leadtime-input" type="number" min="0" step="1" name="ngayNhapHang" value={data.ngayNhapHang || ''} onChange={handleChange} placeholder="30" />
              <span className="mf-leadtime-unit">ngày</span>
            </div>
          </div>
        </div>

        <TagField
          label="Dòng sản phẩm"
          name="congNang"
          value={data.congNang}
          onChange={handleChange}
          availableTags={tags?.congNang || []}
          onAddTag={onAddTag || (() => {})}
          onRemoveTag={onRemoveTag}
        />

        <NhomMauSwatchField
          value={data.nhomMau}
          onChange={handleChange}
          fromOcr={isFromOcr('nhomMau')}
        />

        <BeMaTField
          value={data.beMat}
          onChange={handleChange}
          fromOcr={isFromOcr('beMat')}
          customOptions={tags?.beMat || []}
          onAddOption={(v) => onAddTag && onAddTag('beMat', v)}
          onRemoveOption={(v) => onRemoveTag && onRemoveTag('beMat', v)}
        />

        {!nccSectionDone ? (
          <div className="mf-ncc-confirm">
            <button
              type="button"
              className="btn btn-primary mf-confirm-btn"
              onClick={onConfirmNcc}
              disabled={!hasNcc || !data.collection || !data.maNCC}
            >
              Lưu thông tin NCC → Tiếp tục
            </button>
            {!hasNcc && <span className="mf-hint mf-confirm-hint">Chọn nhà cung cấp để tiếp tục</span>}
            {hasNcc && !data.collection && <span className="mf-hint mf-confirm-hint">Chọn cuốn mẫu để tiếp tục</span>}
            {hasNcc && data.collection && !data.maNCC && <span className="mf-hint mf-confirm-hint">Nhập mã NCC để tiếp tục</span>}
          </div>
        ) : (
          <div className="mf-ncc-done-bar">
            <span className="mf-ncc-done-icon">✓</span>
            <span className="mf-ncc-done-text">Thông tin NCC đã lưu</span>
            <button type="button" className="btn btn-ghost mf-ncc-edit-btn" onClick={onEditNcc}>Sửa lại</button>
          </div>
        )}
      </SectionBlock>

      {!nccSectionDone ? (
        <div className="mf-locked-hint">
          <span className="mf-locked-icon">🔒</span>
          <span>Lưu thông tin NCC để mở phần Thông tin MrFabric</span>
        </div>
      ) : (
        <SectionBlock accent="mrfabric" icon="📦" title="Thông tin MrFabric" subtitle="Chọn dòng sản phẩm → mã tự tạo. Đổi nhóm màu → mã tự cập nhật.">

          {/* Mã MrFabric — full width + breakdown */}
          <div className="form-group">
            <label className="form-label">
              Mã MrFabric *
              <span className="mf-ocr-badge mf-auto-badge">⚙ Tự động</span>
            </label>
            <input
              className={`form-input mf-code-auto${errors?.maMrFabric ? ' form-input--error' : ''}`}
              name="maMrFabric"
              value={data.maMrFabric || ''}
              onChange={handleChange}
              placeholder="Tự tạo khi chọn NCC + Dòng SP + Nhóm màu"
            />
            <MrFabricCodeNote code={data.maMrFabric} data={data} />
            {errors?.maMrFabric && <span className="mf-error">{errors.maMrFabric}</span>}
          </div>

          <div className="mf-grid">
            <div className="form-group">
              <label className="form-label">Phân khúc</label>
              <select className="form-input" name="phanKhuc" value={data.phanKhuc || ''} onChange={handleChange}>
                <option value="">-- Chọn phân khúc --</option>
                {PHAN_KHUC_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select className="form-input" name="trangThai" value={data.trangThai || 'active'} onChange={handleChange}>
                <option value="active">Đang kinh doanh (Active)</option>
                <option value="discontinued">Ngừng kinh doanh (Discontinued)</option>
              </select>
            </div>
          </div>

          {/* Giá bán — 2 loại + công thức */}
          <div className="mf-price-block">
            {data.giaMua && (
              <div className="mf-giamua-ref">
                Giá mua: <strong>{data.giaMua}</strong> VND/m
                <span className="mf-price-formula"> · Công thức: Giá bán = Giá mua × 2.5 (tự động, có thể sửa)</span>
              </div>
            )}
            <div className="mf-grid">
              <PriceField label="Giá bán vải (VND/m)" name="giaBan" value={data.giaBan} onChange={handleChange} />
              <PriceField label="Giá bán rèm (VND/m²)" name="giaBanRem" value={data.giaBanRem} onChange={handleChange} />
            </div>
          </div>

        </SectionBlock>
      )}
    </div>
  )
}

