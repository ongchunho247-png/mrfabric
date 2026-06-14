import { useState } from 'react'
import { loadBudget, setBalance, clearHistory, estimateCost } from '../../../helpers/budgetStorage'

export default function BudgetCard({ slotQualities, colorCount = 1 }) {
  const [budget, setBudget]     = useState(() => loadBudget())
  const [inputVal, setInputVal] = useState('')
  const [editing, setEditing]   = useState(false)

  function handleSetBalance() {
    const val = parseFloat(inputVal)
    if (isNaN(val) || val < 0) return
    const next = setBalance(val)
    setBudget(next)
    setEditing(false)
    setInputVal('')
  }

  function handleClear() {
    if (!confirm('Xóa toàn bộ lịch sử chi phí?')) return
    const next = clearHistory()
    setBudget(next)
  }

  // Reload budget từ localStorage mỗi khi render (để bắt updates từ MultiColorGenerator)
  // dùng key để force re-read khi cần
  const fresh = loadBudget()
  const balance = fresh.balance
  const history = fresh.history

  const estimatedCostPerSet = estimateCost(slotQualities || { slot_1: 'medium', slot_2: 'medium', slot_3: 'low', slot_4: 'low' })
  const estimatedTotal      = +(estimatedCostPerSet * colorCount).toFixed(4)
  const setsLeft            = balance !== null ? Math.floor(balance / estimatedCostPerSet) : null

  return (
    <div className="fit-card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="fit-card-title" style={{ marginBottom: 0 }}>Ngân sách OpenAI</div>
        {history.length > 0 && (
          <button onClick={handleClear} style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Xóa lịch sử
          </button>
        )}
      </div>

      {/* Balance display + edit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>Số dư hiện tại</div>
          {balance !== null ? (
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: balance < 0.5 ? '#dc2626' : 'var(--color-text)' }}>
              ${balance.toFixed(2)}
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Chưa nhập</div>
          )}
        </div>

        {setsLeft !== null && (
          <div style={{ marginLeft: 8, paddingLeft: 12, borderLeft: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>Ước tính còn</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{setsLeft} bộ</div>
          </div>
        )}

        <div style={{ marginLeft: 'auto' }}>
          {editing ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetBalance()}
                placeholder="4.87"
                autoFocus
                style={{ width: 80, padding: '4px 6px', border: '1px solid var(--color-border)', borderRadius: 4, fontSize: '0.85rem' }}
              />
              <button className="btn btn-primary btn-xs" onClick={handleSetBalance}>Lưu</button>
              <button className="btn btn-secondary btn-xs" onClick={() => setEditing(false)}>✕</button>
            </div>
          ) : (
            <button className="btn btn-secondary btn-xs" onClick={() => { setEditing(true); setInputVal(balance?.toFixed(2) || '') }}>
              {balance !== null ? 'Cập nhật' : '+ Nhập số dư'}
            </button>
          )}
        </div>
      </div>

      {/* Estimate for current session */}
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: history.length ? 10 : 0, display: 'flex', gap: 16 }}>
        <span>Chi phí lần này: <strong style={{ color: 'var(--color-text)' }}>${estimatedTotal.toFixed(3)}</strong>{colorCount > 1 ? ` (${colorCount} màu)` : ''}</span>
        {balance !== null && (
          <span>Sau khi chạy: <strong style={{ color: 'var(--color-text)' }}>${Math.max(0, balance - estimatedTotal).toFixed(2)}</strong></span>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 8 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Lịch sử
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 180, overflowY: 'auto' }}>
            {history.map((h) => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.8rem', padding: '3px 0', borderBottom: '1px solid var(--color-border-light, #f5f5f5)' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>{h.date} {h.time}</span>
                  <span style={{ fontWeight: 500 }}>{h.maNCC || h.maMrFabric || '—'}</span>
                  {h.colorCount > 1 && <span style={{ color: 'var(--color-text-muted)' }}>{h.colorCount} màu</span>}
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>{h.preset}</span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>-${h.totalCost.toFixed(3)}</span>
                  {h.balanceBefore !== null && h.balanceAfter !== null && (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem', marginLeft: 6 }}>
                      ${h.balanceBefore.toFixed(2)} → ${h.balanceAfter.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
