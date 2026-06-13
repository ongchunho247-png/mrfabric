import './SearchBar.css'

export default function SearchBar({ value, onChange }) {
  return (
    <div className="searchbar">
      <span className="searchbar-icon" aria-hidden="true">⌕</span>
      <input
        className="searchbar-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm theo mã MrFabric, tên màu, nhà cung cấp, công năng..."
      />
      {value && (
        <button className="searchbar-clear" onClick={() => onChange('')} title="Xóa tìm kiếm">
          ✕
        </button>
      )}
    </div>
  )
}
