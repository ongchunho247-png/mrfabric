import './Header.css'

export default function Header({ activeTab, onTabChange }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="header-logo">MrFabric</span>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-btn${activeTab === 'library' ? ' nav-btn--active' : ''}`}
            onClick={() => onTabChange('library')}
          >
            Thư viện
          </button>
          <button
            className={`nav-btn${activeTab === 'admin' ? ' nav-btn--active' : ''}`}
            onClick={() => onTabChange('admin')}
          >
            Admin
          </button>
        </nav>
      </div>
    </header>
  )
}
