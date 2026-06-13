import { useState } from 'react'
import Header from './components/Header'
import LibraryPage from './components/library/LibraryPage'
import AdminPage from './components/admin/AdminPage'
import { initialMaterials } from './data/initialMaterials'
import { loadAdminMaterials, addAdminMaterial, updateAdminMaterial } from './helpers/materialStorage'
import { loadMoodboard } from './helpers/moodboardStorage'
import './App.css'

// Dev-only — tree-shaken out by Vite in production build
import DevNoteOverlay from './components/dev/DevNoteOverlay'

function App() {
  const [activeTab, setActiveTab] = useState('library')
  const [adminMaterials, setAdminMaterials] = useState(() => loadAdminMaterials())
  const [moodboardItems, setMoodboardItems] = useState(() => loadMoodboard())

  // Admin materials with same ID override initial materials (editable initial products)
  const adminIds = new Set(adminMaterials.map((m) => m.id))
  const allMaterials = [
    ...initialMaterials.filter((m) => !adminIds.has(m.id)),
    ...adminMaterials,
  ]

  function handleUpdateMaterialImage(materialId, imageKey, dataUrl) {
    setAdminMaterials((prev) => {
      const existing = prev.find((m) => m.id === materialId)
      const base = existing || initialMaterials.find((m) => m.id === materialId)
      if (!base) return prev
      const updatedImages = {
        ...(base.images || {}),
        [imageKey]: { ...(base.images?.[imageKey] || {}), path: dataUrl },
      }
      if (existing) return updateAdminMaterial(prev, { ...existing, images: updatedImages })
      return addAdminMaterial(prev, { ...base, images: updatedImages })
    })
  }

  return (
    <div className="app">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="app-main">
        {activeTab === 'library' ? (
          <LibraryPage
            allMaterials={allMaterials}
            moodboardItems={moodboardItems}
            setMoodboardItems={setMoodboardItems}
            onUpdateMaterialImage={handleUpdateMaterialImage}
          />
        ) : (
          <AdminPage
            allMaterials={allMaterials}
            adminMaterials={adminMaterials}
            setAdminMaterials={setAdminMaterials}
            onGoToLibrary={() => setActiveTab('library')}
            onUpdateMaterialImage={handleUpdateMaterialImage}
          />
        )}
      </main>
      {import.meta.env.DEV && <DevNoteOverlay />}
    </div>
  )
}

export default App
