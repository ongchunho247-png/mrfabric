import { useState, useRef, useEffect, useCallback } from 'react'
import './DevNoteOverlay.css'

const STORAGE_KEY = 'mrfabric_dev_notes'

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}

// Page-level containers (broadest)
const PAGE_MAP = [
  ['admin-page', 'Trang Admin'],
  ['library-page', 'Thư viện vật liệu'],
]

// Section-level areas within a page (specific → general order)
const AREA_MAP = [
  // Admin sections
  ['admin-ocr-section', 'Đọc nhãn AI'],
  ['admin-edit-banner', 'Banner đang sửa'],
  ['admin-form-section', 'Form vật liệu'],
  ['admin-actions', 'Nút hành động'],
  ['admin-save-msg', 'Thông báo lưu'],
  ['wf-guide', 'Hướng dẫn nhập liệu'],
  ['admin-page-header', 'Header Admin'],
  // Admin tabs content
  ['ptm-wrap', 'Bảng đơn giá'],
  ['vis-mgr', 'Ẩn/Hiện Vật liệu'],
  ['biu-wrap', 'Cập nhật ảnh hàng loạt'],
  ['mi-wrap', 'Tổng hợp vật liệu'],
  ['lvm-wrap', 'Cài đặt kiểu xem'],
  ['ncm-wrap', 'Danh mục NCC'],
  // Library
  ['lv-selector', 'Chọn chế độ xem'],
  ['fp-card', 'Bộ lọc'],
  ['material-grid', 'Lưới vật liệu'],
  ['library-sidebar', 'Sidebar thư viện'],
  ['library-content', 'Nội dung thư viện'],
  // Moodboard & modals
  ['moodboard-panel', 'Moodboard'],
  ['moodboard', 'Moodboard'],
  ['material-detail-modal', 'Chi tiết vật liệu'],
  ['admin-material-modal', 'Chi tiết vật liệu (Admin)'],
]

function elemTypeHint(el) {
  if (el.matches('input[type="checkbox"]')) return 'Checkbox'
  if (el.matches('input[type="number"]')) return 'Ô số'
  if (el.matches('input[type="text"], input:not([type])')) return 'Ô nhập văn bản'
  if (el.matches('select')) return 'Dropdown'
  if (el.matches('textarea')) return 'Vùng nhập'
  if (el.matches('button')) return 'Nút'
  if (el.matches('th')) return 'Tiêu đề cột'
  if (el.matches('td')) return 'Ô bảng'
  return null
}

// Returns { page, area, subArea } — 3-level hierarchy
function getAreaContext(clientX, clientY) {
  const all = document.elementsFromPoint(clientX, clientY)
  const candidates = all.filter(
    (el) =>
      !el.classList.contains('dn-layer') &&
      !el.closest('.dn-bar') &&
      !el.closest('.dn-panel') &&
      el.tagName !== 'HTML' &&
      el.tagName !== 'BODY',
  )

  // Level 1 — Page: scan from most-specific → find page container
  let page = null
  for (const el of candidates) {
    for (const [cls, label] of PAGE_MAP) {
      if (el.classList.contains(cls)) { page = label; break }
    }
    if (page) break
  }

  // Collect all data-dn-area values innermost → outermost
  const dnAreas = []
  for (const el of candidates) {
    const attr = el.getAttribute('data-dn-area')
    if (attr && !dnAreas.includes(attr)) dnAreas.push(attr)
  }

  // Level 2 — Area (section): outermost dn-area or AREA_MAP
  // Level 3 — SubArea (element): innermost dn-area OR specific element label
  let area = null
  let subArea = null

  if (dnAreas.length >= 2) {
    area = dnAreas[dnAreas.length - 1]
    subArea = dnAreas[0]
  } else if (dnAreas.length === 1) {
    area = dnAreas[0]
  }

  // Fallback area detection from section-title / aria-label / AREA_MAP
  if (!area) {
    for (const el of candidates) {
      const titleEl = el.querySelector(':scope > .section-title')
      if (titleEl) { area = titleEl.textContent.trim(); break }
    }
  }
  if (!area) {
    for (const el of candidates) {
      const label = el.getAttribute('aria-label')
      if (label) { area = label; break }
    }
  }
  if (!area) {
    outer: for (const el of candidates) {
      for (const [cls, label] of AREA_MAP) {
        if (el.classList.contains(cls)) { area = label; break outer }
      }
    }
  }

  // Level 3 — SubArea: derive from clicked element with richer context
  if (!subArea && candidates.length > 0) {
    const clicked = candidates[0]
    const parts = []

    // NCC/section accordion header context (walk up ancestors)
    for (const el of candidates) {
      const nameEl =
        el.querySelector(':scope > .ptm-ncc-name') ||
        el.querySelector(':scope > .vis-ncc-name') ||
        el.querySelector(':scope > .vis-group-name')
      if (nameEl) { parts.push(nameEl.textContent.trim()); break }
    }

    // Column header lookup when clicking a <td>
    const td = clicked.matches('td') ? clicked : clicked.closest('td')
    if (td) {
      const tr = td.closest('tr')
      const table = td.closest('table')
      if (tr && table) {
        const colIdx = Array.from(tr.children).indexOf(td)
        const headerRow = table.querySelector('thead tr') || table.querySelector('tr:first-child')
        if (headerRow && colIdx >= 0) {
          const th = headerRow.children[colIdx]
          const thText = th?.textContent?.trim()
          if (thText) parts.push(`Cột: ${thText}`)
        }
      }
    }

    // Form group label
    const formLabel = clicked.closest('.form-group')?.querySelector('.form-label, label')?.textContent?.trim()
    if (formLabel) {
      parts.push(formLabel)
    } else {
      // Element-specific label (aria-label, title, placeholder, button text, th text)
      const elemLabel =
        clicked.getAttribute('aria-label') ||
        clicked.getAttribute('title') ||
        clicked.getAttribute('placeholder') ||
        (clicked.matches('button') ? clicked.textContent?.trim() : null) ||
        (clicked.matches('label') ? clicked.textContent?.trim() : null) ||
        (clicked.matches('th') ? clicked.textContent?.trim() : null)
      if (elemLabel) parts.push(elemLabel)
    }

    // Element type hint if nothing else descriptive was found
    if (parts.length === 0 || (parts.length === 1 && !formLabel && !td)) {
      const hint = elemTypeHint(clicked)
      if (hint) parts.push(`[${hint}]`)
    }

    if (parts.length > 0) {
      const clean = parts.join(' › ').replace(/\s+/g, ' ').trim().slice(0, 80)
      if (clean && clean !== area) subArea = clean
    }
  }

  return { page, area, subArea }
}

// Format location: "Page - Section - Element" (3 levels)
function formatLocation(note) {
  const parts = [note.page, note.area, note.subArea].filter(Boolean)
  return parts.length > 0 ? parts.join(' - ') : null
}

export default function DevNoteOverlay() {
  const [isActive, setIsActive] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [notes, setNotes] = useState(loadNotes)
  const [editId, setEditId] = useState(null)
  const [drafts, setDrafts] = useState({})

  const nextNum = useRef(
    notes.length > 0 ? Math.max(...notes.map((n) => n.num)) + 1 : 1
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  }, [notes])

  const handleLayerClick = useCallback(
    (e) => {
      if (e.target.closest('.dn-bar')) return
      const num = nextNum.current++
      const { page, area, subArea } = getAreaContext(e.clientX, e.clientY)
      const note = { id: `dn-${Date.now()}`, num, x: Math.round(e.clientX), y: Math.round(e.clientY), page, area, subArea, content: '' }
      setNotes((prev) => [...prev, note])
      setEditId(note.id)
      setDrafts((prev) => ({ ...prev, [note.id]: '' }))
    },
    []
  )

  function deleteNote(id) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    if (editId === id) setEditId(null)
  }

  function saveNote(id) {
    const content = drafts[id] ?? ''
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, content } : n)))
    setEditId(null)
  }

  function startEdit(note) {
    setEditId(note.id)
    setDrafts((prev) => ({ ...prev, [note.id]: note.content }))
  }

  function exportNotes() {
    if (notes.length === 0) { alert('Chưa có note nào.'); return }
    const text = [...notes]
      .sort((a, b) => a.num - b.num)
      .map((n) => {
        const lines = [
          `Note ${n.num}`,
          `Vị trí: x: ${n.x}, y: ${n.y}`,
        ]
        const loc = formatLocation(n)
        if (loc) lines.push(`Khu vực: ${loc}`)
        lines.push(`Nội dung: ${n.content || '(chưa có nội dung)'}`)
        return lines.join('\n')
      })
      .join('\n\n')
    navigator.clipboard.writeText(text)
      .then(() => alert('Đã copy tất cả note vào clipboard!'))
      .catch(() => prompt('Copy nội dung dưới đây:', text))
  }

  function clearAll() {
    if (window.confirm('Xóa toàn bộ note?')) {
      setNotes([])
      nextNum.current = 1
    }
  }

  const sortedNotes = [...notes].sort((a, b) => a.num - b.num)

  return (
    <>
      {/* Capture layer — only active in note mode */}
      {isActive && (
        <div className="dn-layer" onClick={handleLayerClick} />
      )}

      {/* Horizontal note bar — always visible when notes exist */}
      {notes.length > 0 && (
        <div className="dn-bar" onClick={(e) => e.stopPropagation()}>
          {sortedNotes.map((note) => {
            const isEditing = editId === note.id
            return (
              <div key={note.id} className={`dn-nc${isEditing ? ' dn-nc--on' : ''}`}>
                <div className="dn-nc-head">
                  <span className="dn-nc-num">#{note.num}</span>
                  {formatLocation(note)
                    ? <span className="dn-nc-area" title={formatLocation(note)}>{formatLocation(note)}</span>
                    : <span className="dn-nc-pos">{note.x},{note.y}</span>
                  }
                  <button className="dn-nc-x" onClick={() => deleteNote(note.id)} title="Xóa">✕</button>
                </div>

                {isEditing ? (
                  <div className="dn-nc-edit">
                    <textarea
                      className="dn-nc-ta"
                      value={drafts[note.id] ?? note.content}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [note.id]: e.target.value }))
                      }
                      placeholder="Ghi chú..."
                      autoFocus
                      rows={3}
                    />
                    {(note.area || note.subArea) && (
                      <div className="dn-nc-pos-row">{note.x},{note.y}</div>
                    )}
                    <div className="dn-nc-btns">
                      <button className="dn-nc-btn dn-nc-btn--save" onClick={() => saveNote(note.id)}>Lưu</button>
                      <button className="dn-nc-btn dn-nc-btn--cancel" onClick={() => setEditId(null)}>Huỷ</button>
                    </div>
                  </div>
                ) : (
                  <div className="dn-nc-body" onClick={() => startEdit(note)} title="Click để chỉnh sửa">
                    {note.content
                      ? note.content
                      : <em className="dn-nc-empty">Click để ghi chú...</em>
                    }
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom-right panel */}
      <div className="dn-panel">
        {isPanelOpen && (
          <div className="dn-panel-popup">
            <div className="dn-panel-top">
              <strong className="dn-panel-title">
                Dev Notes {notes.length > 0 && `(${notes.length})`}
              </strong>
              <div className="dn-panel-actions">
                <button className="dn-pa-btn" onClick={exportNotes}>
                  Copy tất cả
                </button>
                {notes.length > 0 && (
                  <button className="dn-pa-btn dn-pa-btn--del" onClick={clearAll}>
                    Xóa hết
                  </button>
                )}
              </div>
            </div>

            <div className="dn-panel-list">
              {notes.length === 0 ? (
                <p className="dn-panel-empty">
                  Bật Dev Note Mode rồi click vào giao diện để tạo note.
                </p>
              ) : (
                sortedNotes.map((n) => (
                  <div key={n.id} className="dn-panel-row">
                    <div className="dn-pr-top">
                      <span className="dn-pr-num">Note {n.num}</span>
                      <span className="dn-pr-pos">x:{n.x} y:{n.y}</span>
                    </div>
                    {formatLocation(n) && (
                      <div className="dn-pr-area">{formatLocation(n)}</div>
                    )}
                    <div className="dn-pr-content">
                      {n.content || <em className="dn-note-empty">(trống)</em>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="dn-toolbar">
          <button
            className={`dn-toggle${isActive ? ' dn-toggle--on' : ''}`}
            onClick={() => setIsActive((v) => !v)}
            title={isActive ? 'Tắt Dev Note Mode' : 'Bật Dev Note Mode'}
          >
            📌 {isActive ? 'Đang ghi chú...' : 'Dev Note'}
          </button>
          <button
            className={`dn-count${isPanelOpen ? ' dn-count--on' : ''}`}
            onClick={() => setIsPanelOpen((v) => !v)}
            title="Xem danh sách note"
          >
            {notes.length > 0 ? notes.length : '≡'}
          </button>
        </div>
      </div>
    </>
  )
}
