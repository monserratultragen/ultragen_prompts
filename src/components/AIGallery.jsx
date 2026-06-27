import { useState, useEffect } from 'react'
import axios from 'axios'
import { getImageUrl } from '../utils/imageUtils'

export default function AIGallery() {
  const [imagenes, setImagenes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/imagenes-ai-base/`)
      .then((res) => setImagenes(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Cargando galería...</div>

  return (
    <div className="gallery-grid">
      {imagenes.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center' }}>Sin imágenes base.</p>}
      {imagenes.map((img) => (
        <div key={img.id} className="gallery-card">
          <img src={getImageUrl(img.path)} alt={img.descripcion || 'Imagen AI'} />
          <div className="gallery-info">
            <p><strong>{img.descripcion || '—'}</strong></p>
            <p className="gallery-prompt">{img.prompt_utilizado || ''}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
