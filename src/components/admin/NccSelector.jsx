import { useState } from 'react'
import './NccSelector.css'

export default function NccSelector({ value, nccList, onSelect, onAddNcc }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState('')

  function handleSelectChange(e) {
    const val = e.target.value
    if (val === '__add__') {
      setShowAdd(true)
    } else {
      onSelect(val)
    }
  }

  function handleConfirmAdd() {
    const trimmed = newName.trim()
    if (!trimmed) {
      setAddError('Vui lòng nhập tên NCC.')
      return
    }
    if (nccList.includes(trimmed)) {
      setAddError('NCC này đã có trong danh sách.')
      return
    }
    onAddNcc(trimmed)
    onSelect(trimmed)
    setNewName('')
    setAddError('')
    setShowAdd(false)
  }

  function handleCancel() {
    setShowAdd(false)
    setNewName('')
    setAddError('')
  }

  return (
    <div className="ncc-selector">
      <select
        className="form-input"
        value={showAdd ? '__add__' : (value || '')}
        onChange={handleSelectChange}
      >
        <option value="">-- Chọn nhà cung cấp --</option>
        {nccList.map((ncc) => (
          <option key={ncc} value={ncc}>{ncc}</option>
        ))}
        <option value="__add__">+ Thêm NCC mới...</option>
      </select>

      {showAdd && (
        <div className="ncc-add-panel">
          <input
            className="form-input"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setAddError('') }}
            placeholder="Tên nhà cung cấp mới"
            onKeyDown={(e) => e.key === 'Enter' && handleConfirmAdd()}
            autoFocus
          />
          {addError && <span className="ncc-error">{addError}</span>}
          <div className="ncc-add-actions">
            <button className="btn btn-primary" onClick={handleConfirmAdd}>Thêm</button>
            <button className="btn btn-ghost" onClick={handleCancel}>Hủy</button>
          </div>
        </div>
      )}
    </div>
  )
}
