import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import MasterKeyModal from './components/MasterKeyModal'
import BackupsPage from './components/BackupsPage'

function App() {
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem('master_unlocked') === 'true')
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(!unlocked)

  useEffect(() => {
    if (!unlocked) return
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/capitulos/`)
      .then((res) => {
        const sorted = res.data.sort((a, b) =>
          (a.diario_orden - b.diario_orden) ||
          (a.tomo_orden - b.tomo_orden) ||
          (a.tomo_id - b.tomo_id) ||
          (a.orden - b.orden) ||
          (a.id - b.id)
        )
        setChapters(sorted)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [unlocked])

  if (!unlocked) {
    return <MasterKeyModal onUnlock={() => setUnlocked(true)} />
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888' }}>
        <p>Cargando estructura de capítulos...</p>
      </div>
    )
  }

  return <BackupsPage chapters={chapters} />
}

export default App
