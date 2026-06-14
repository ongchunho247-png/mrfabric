import { useState, useCallback } from 'react'
import { getAllColors, saveColorHex, resetColorHex } from '../../helpers/colorDictStorage'

export default function ColorDictEditor() {
  const [colors, setColors] = useState(() => getAllColors())

  const refresh = useCallback(() => setColors(getAllColors()), [])

  function handleChange(code, hex) {
    saveColorHex(code, hex)
    refresh()
  }

  function handleReset(code) {
    resetColorHex(code)
    refresh()
  }

  const overriddenCount = colors.filter((c) => c.isOverridden).length

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 0' }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600 }}>Bảng màu nhóm</h3>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          HEX được dùng làm tham chiếu màu cho AI khi tạo ảnh. Điều chỉnh để khớp với màu thực tế của vải.
          {overriddenCount > 0 && (
            <span style={{ marginLeft: 8, color: 'var(--color-accent)', fontWeight: 500 }}>
              {overriddenCount} màu đã tùy chỉnh
            </span>
          )}
        </p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid var(--color-border)' }}>
            <th style={{ textAlign: 'left', padding: '6px 0', width: 40 }}>Màu</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>Tên</th>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>Mã</th>
            <th style={{ textAlign: 'center', padding: '6px 8px', width: 56 }}>Chọn</th>
            <th style={{ textAlign: 'left', padding: '6px 8px', width: 90 }}>HEX</th>
            <th style={{ width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {colors.map((c) => (
            <tr
              key={c.code}
              style={{
                borderBottom: '1px solid var(--color-border-light, #f0f0f0)',
                background: c.isOverridden ? 'var(--color-surface-alt, #fafafa)' : undefined,
              }}
            >
              {/* Swatch hiện tại */}
              <td style={{ padding: '6px 0' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: c.hex,
                    border: '1.5px solid var(--color-border)',
                    boxShadow: c.isOverridden ? `0 0 0 2px var(--color-accent)` : undefined,
                  }}
                />
              </td>

              {/* Tên màu */}
              <td style={{ padding: '6px 8px' }}>
                <span style={{ fontWeight: 500 }}>{c.name_vi}</span>
                <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>{c.name_en}</span>
              </td>

              {/* Code 2 ký tự */}
              <td style={{ padding: '6px 8px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                {c.code}
              </td>

              {/* Color picker */}
              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => handleChange(c.code, e.target.value)}
                  style={{ width: 36, height: 28, padding: 1, border: '1px solid var(--color-border)', borderRadius: 4, cursor: 'pointer' }}
                />
              </td>

              {/* HEX value */}
              <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                <span style={{ color: c.isOverridden ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                  {c.hex.toUpperCase()}
                </span>
              </td>

              {/* Reset button — chỉ hiện khi đã override */}
              <td style={{ padding: '6px 4px' }}>
                {c.isOverridden && (
                  <button
                    onClick={() => handleReset(c.code)}
                    title={`Reset về mặc định (${c.defaultHex})`}
                    style={{
                      fontSize: '0.72rem',
                      padding: '2px 7px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 4,
                      background: 'var(--color-surface)',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        Lưu tự động vào trình duyệt. Tham chiếu màu mặc định từ <code>colorGroups.js</code> — thay đổi ở đây chỉ ghi đè cho AI rendering, không ảnh hưởng bộ lọc thư viện.
      </p>
    </div>
  )
}
