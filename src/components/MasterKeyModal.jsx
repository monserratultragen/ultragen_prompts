import { useState } from 'react'
import axios from 'axios'

export default function MasterKeyModal({ onUnlock }) {
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!clave.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/claves-acceso/validar/`,
        { clave: clave.trim() }
      )
      if (res.data.status === 'valida' && res.data.tipo === 'maestra') {
        sessionStorage.setItem('master_unlocked', 'true')
        onUnlock()
      } else {
        setError('Clave incorrecta o sin permisos suficientes.')
      }
    } catch {
      setError('Error al validar la clave. Verifique la conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="masterkey-overlay">
      <div className="masterkey-modal">
        <h2>🔐 Gestor de Prompts</h2>
        <p>Ingrese la clave maestra para acceder</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="Clave maestra"
            autoFocus
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Validando...' : 'Entrar'}
          </button>
        </form>
        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  )
}
