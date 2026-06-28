import { useState, useEffect } from 'react'
import axios from 'axios'
import { getImageUrl } from '../utils/imageUtils'
import AIBackupsTable from './AIBackupsTable'

const PREDEFINED_TAGS = [
    'piel', 'top', 'tank top', 'pantalón', 'shorts', 'mochila', 'camiseta', 'lentes',
    'camisa', 'vestido', 'aros', 'deportivo',
    'postura', 'piernas', 'glúteos', 'primer plano', 'manos', 'brazos', 'sentada',
    'cintura', 'caderas', 'frontal', 'espalda', 'caída',
    'campo', 'gimnasio', 'baño', 'interior', 'exterior', 'casa', 'selva', 'pasillo',
    'cama', 'camino', 'lluvia', 'piscina',
    'oscuro', 'suave', 'elegante', 'cinematográfico', 'pastel', 'dramático', 'formal',
    'casual', 'industrial', 'nocturno', 'soft',
    'luz', 'natural', 'iluminación', 'sombras', 'foco', 'silueta', 'luz cálida',
    'atardecer', 'luces', 'luz natural', 'iluminado', 'sombra',
    'tirantes', 'bolso', 'guantes', 'cinturón', 'gafas', 'collar', 'pendientes', 'pulsera', 'auriculares'
]

const BackupsPage = ({ chapters }) => {
    const [activeTab, setActiveTab] = useState('chapter_backups')
    const [prompts, setPrompts] = useState([])
    const [images, setImages] = useState([])
    const [activeTags, setActiveTags] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [promptSortOrder, setPromptSortOrder] = useState('created_desc')
    const [categories, setCategories] = useState([])
    const [toast, setToast] = useState(null)
    const [selectedSinglePrompt, setSelectedSinglePrompt] = useState(null)

    const showToast = (message) => {
        setToast(message)
        setTimeout(() => setToast(null), 1500)
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

                const responses = await Promise.all([
                    axios.get(`${apiUrl}/api/prompts-ai/`),
                    axios.get(`${apiUrl}/api/imagenes-ai-base/`),
                    axios.get(`${apiUrl}/api/prompt-categorias/`)
                ])
                setPrompts(responses[0].data)
                setImages(responses[1].data)
                setCategories(responses[2].data)
            } catch (err) {
                console.error("Error fetching AI data:", err)
                setError("No se pudieron cargar los datos de AI.")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const tabStyle = (isActive) => ({
        padding: '8px 8px',
        cursor: 'pointer',
        borderBottom: isActive ? '2px solid var(--accent-color, #ff4c4c)' : '2px solid transparent',
        color: isActive ? 'var(--accent-color, #ff4c4c)' : '#888',
        fontWeight: isActive ? 'bold' : 'normal',
        fontSize: '0.7rem',
        transition: 'all 0.3s ease',
        background: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        outline: 'none',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        flex: '1',
        textAlign: 'center',
        whiteSpace: 'nowrap'
    })

    const EyeIcon = () => (
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    )

    const CopyIcon = () => (
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
    )

    const IconButton = ({ onClick, icon: Icon, title, color = 'var(--accent-color, #ff4c4c)' }) => (
        <span
            onClick={(e) => { e.stopPropagation(); onClick() }}
            title={title}
            className="action-icon-btn"
            style={{
                color: color,
                cursor: 'pointer',
                padding: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                borderRadius: '50%',
                margin: '0 1px'
            }}
        >
            <Icon />
        </span>
    )

    const categoryFilteredPrompts = prompts.filter(p => selectedCategory === 'all' || p.categoria === selectedCategory)

    const tagAvailability = {}
    if (activeTags.length === 0) {
        PREDEFINED_TAGS.forEach(tag => {
            tagAvailability[tag] = categoryFilteredPrompts.some(p => {
                const textToSearch = `${p.titulo} ${p.prompt} ${p.notas || ''}`.toLowerCase()
                return textToSearch.includes(tag.toLowerCase())
            })
        })
    } else {
        PREDEFINED_TAGS.forEach(tag => {
            if (activeTags.includes(tag)) {
                tagAvailability[tag] = true
            } else {
                const testTags = [...activeTags, tag]
                tagAvailability[tag] = categoryFilteredPrompts.some(p => {
                    const textToSearch = `${p.titulo} ${p.prompt} ${p.notas || ''}`.toLowerCase()
                    return testTags.every(t => textToSearch.includes(t.toLowerCase()))
                })
            }
        })
    }

    const categoryAvailability = {}
    if (activeTags.length === 0) {
        categories.forEach(cat => { categoryAvailability[cat.id] = true })
    } else {
        categories.forEach(cat => {
            const promptsInCat = prompts.filter(p => p.categoria === cat.id)
            categoryAvailability[cat.id] = promptsInCat.some(p => {
                const textToSearch = `${p.titulo} ${p.prompt} ${p.notas || ''}`.toLowerCase()
                return activeTags.every(tag => textToSearch.includes(tag.toLowerCase()))
            })
        })
    }

    const filteredAndSortedPrompts = categoryFilteredPrompts
        .filter(p => {
            if (activeTags.length === 0) return true
            const textToSearch = `${p.titulo} ${p.prompt} ${p.notas || ''}`.toLowerCase()
            return activeTags.every(tag => textToSearch.includes(tag.toLowerCase()))
        })
        .sort((a, b) => {
            if (promptSortOrder === 'created_desc') return new Date(b.created_at) - new Date(a.created_at)
            if (promptSortOrder === 'created_asc') return new Date(a.created_at) - new Date(b.created_at)
            if (promptSortOrder === 'updated_desc') return new Date(b.updated_at) - new Date(a.updated_at)
            if (promptSortOrder === 'updated_asc') return new Date(a.updated_at) - new Date(b.updated_at)
            return 0
        })

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#aaa' }}>
            <p style={{ fontSize: '0.75rem' }}>Cargando archivos clasificados...</p>
        </div>
    )

    return (
        <div className="container" style={{
            paddingTop: '12px',
            paddingBottom: '100px',
            position: 'relative'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '8px',
                paddingInline: '12px'
            }}>
                <h1 style={{ margin: 0, fontSize: '0.9rem', textAlign: 'center', letterSpacing: '1px' }}>BACKUPS AI</h1>
            </div>

            <div style={{
                display: 'flex',
                gap: '2px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '14px',
                justifyContent: 'center'
            }}>
                <button onClick={() => setActiveTab('base_images')} style={tabStyle(activeTab === 'base_images')}>
                    img base
                </button>
                <button onClick={() => setActiveTab('featured_prompts')} style={tabStyle(activeTab === 'featured_prompts')}>
                    prompts vip
                </button>
                <button onClick={() => setActiveTab('chapter_backups')} style={tabStyle(activeTab === 'chapter_backups')}>
                    prompt lista
                </button>
            </div>

            {error && <div style={{ color: '#ff4d4d', textAlign: 'center', padding: '20px', fontSize: '0.75rem' }}>{error}</div>}

            {!error && (
                <div>
                    {activeTab === 'base_images' && (
                        <div>
                            <h3 style={{ color: '#aaa', marginBottom: '10px', textAlign: 'center', fontSize: '0.75rem' }}>Galeria de imagenes</h3>
                            {images.length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', fontSize: '0.7rem' }}>No hay imagenes registradas aun.</p>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '6px',
                                    justifyContent: 'center'
                                }}>
                                    {images.map(item => (
                                        <div key={item.id} style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '6px',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}>
                                            <div style={{ width: '100%', height: '160px', backgroundColor: '#111', overflow: 'hidden' }}>
                                                {item.imagen ? (
                                                    <img
                                                        src={getImageUrl(item.imagen)}
                                                        alt={item.titulo}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.65rem' }}>Sin imagen</div>
                                                )}
                                            </div>
                                            <div style={{ padding: '6px 8px' }}>
                                                <h4 style={{ color: '#fff', fontSize: '0.7rem', margin: '0 0 3px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.titulo}</h4>
                                                {item.notas && <p style={{ color: '#888', fontSize: '0.6rem', margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.notas}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'featured_prompts' && (
                        <div>
                            <h3 style={{ color: '#aaa', marginBottom: '10px', textAlign: 'center', fontSize: '0.75rem' }}>Lista de Prompts AI</h3>

                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '5px',
                                justifyContent: 'center',
                                marginBottom: '12px',
                                padding: '0 6px'
                            }}>
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    style={{
                                        padding: '3px 8px',
                                        borderRadius: '20px',
                                        border: '1px solid',
                                        borderColor: selectedCategory === 'all' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                                        backgroundColor: selectedCategory === 'all' ? 'rgba(255, 76, 76, 0.1)' : 'transparent',
                                        color: selectedCategory === 'all' ? 'var(--accent-color)' : '#888',
                                        fontSize: '0.6rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontWeight: selectedCategory === 'all' ? 'bold' : 'normal',
                                        opacity: activeTags.length === 0 ? 1 : 0.5
                                    }}
                                >
                                    Todos
                                </button>
                                {categories.map(cat => {
                                    const available = categoryAvailability[cat.id]
                                    const isSelected = selectedCategory === cat.id
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                if (activeTags.length > 0 && !available && !isSelected) return
                                                setSelectedCategory(cat.id)
                                            }}
                                            style={{
                                                padding: '3px 8px',
                                                borderRadius: '20px',
                                                border: '1px solid',
                                                borderColor: isSelected ? 'var(--accent-color)' : (available ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'),
                                                backgroundColor: isSelected ? 'rgba(255, 76, 76, 0.1)' : 'transparent',
                                                color: isSelected ? 'var(--accent-color)' : (available ? '#888' : '#333'),
                                                fontSize: '0.6rem',
                                                cursor: available || isSelected ? 'pointer' : 'default',
                                                transition: 'all 0.2s ease',
                                                fontWeight: isSelected ? 'bold' : 'normal',
                                                opacity: isSelected ? 1 : (available ? 0.85 : 0.35),
                                            }}
                                        >
                                            {cat.nombre}
                                        </button>
                                    )
                                })}
                            </div>

                            <div style={{
                                marginBottom: '8px',
                                padding: '0 4px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '3px',
                                    flexWrap: 'wrap',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: '8px',
                                    padding: '6px 8px',
                                }}>
                                    <span style={{
                                        fontSize: '0.55rem',
                                        color: '#555',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        whiteSpace: 'nowrap',
                                        marginRight: '2px',
                                        paddingTop: '3px',
                                        width: '100%',
                                        marginBottom: '3px'
                                    }}>
                                        🏷️ filtros rápidos
                                    </span>
                                    {PREDEFINED_TAGS.map(tag => {
                                        const isActive = activeTags.includes(tag)
                                        const available = tagAvailability[tag]
                                        return (
                                            <button
                                                key={tag}
                                                onClick={() => {
                                                    if (!available && !isActive) return
                                                    setActiveTags(prev =>
                                                        isActive ? prev.filter(t => t !== tag) : [...prev, tag]
                                                    )
                                                }}
                                                style={{
                                                    padding: '2px 6px',
                                                    borderRadius: '50px',
                                                    border: `1px solid ${isActive ? 'var(--accent-color, #ff4c4c)' : (!available ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)')}`,
                                                    backgroundColor: isActive ? 'rgba(255,76,76,0.15)' : 'transparent',
                                                    color: isActive ? 'var(--accent-color, #ff4c4c)' : (!available ? '#333' : '#666'),
                                                    fontSize: '0.55rem',
                                                    cursor: available || isActive ? 'pointer' : 'default',
                                                    transition: 'all 0.2s ease',
                                                    fontWeight: isActive ? '600' : 'normal',
                                                    boxShadow: isActive ? '0 0 6px rgba(255,76,76,0.25)' : 'none',
                                                    letterSpacing: '0.2px',
                                                    lineHeight: '1.4',
                                                    opacity: isActive ? 1 : (available ? 0.85 : 0.35),
                                                }}
                                            >
                                                {tag}
                                            </button>
                                        )
                                    })}
                                    {activeTags.length > 0 && (
                                        <button
                                            onClick={() => setActiveTags([])}
                                            style={{
                                                padding: '2px 6px',
                                                borderRadius: '50px',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                backgroundColor: 'rgba(255,255,255,0.06)',
                                                color: '#aaa',
                                                fontSize: '0.55rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                whiteSpace: 'nowrap',
                                                lineHeight: '1.4',
                                            }}
                                        >
                                            ✕ limpiar ({activeTags.length})
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                marginBottom: '8px',
                                padding: '0 6px',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span style={{ fontSize: '0.6rem', color: '#888' }}>Ordenar:</span>
                                <select
                                    value={promptSortOrder}
                                    onChange={e => setPromptSortOrder(e.target.value)}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        color: '#ccc',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="created_desc" style={{background: '#111'}}>Nuevos</option>
                                    <option value="created_asc" style={{background: '#111'}}>Antiguos</option>
                                    <option value="updated_desc" style={{background: '#111'}}>Editados</option>
                                </select>
                            </div>

                            {filteredAndSortedPrompts.length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', fontSize: '0.7rem' }}>No hay prompts en esta categoría.</p>
                            ) : (
                                <div style={{
                                    overflowX: 'auto',
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#eee', fontSize: '0.7rem' }}>
                                        <thead style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                                            <tr>
                                                <th style={{ padding: '8px 6px', textAlign: 'left', borderBottom: '1px solid #333' }}>Título</th>
                                                <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #333', width: '60px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAndSortedPrompts.map(prompt => (
                                                <tr key={prompt.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <td style={{ padding: '6px 6px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ color: 'var(--accent-color)', fontSize: '0.7rem' }}>{prompt.titulo}</span>
                                                            <span style={{
                                                                fontSize: '0.55rem',
                                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                                                padding: '1px 5px',
                                                                borderRadius: '3px',
                                                                color: '#666',
                                                                textTransform: 'uppercase',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                {prompt.categoria_nombre || 'sin cat'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '4px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                        <IconButton icon={CopyIcon} onClick={() => { navigator.clipboard.writeText(prompt.prompt); showToast("Prompt copiado") }} title="Copiar" color="#00ffcc" />
                                                        <IconButton icon={EyeIcon} onClick={() => setSelectedSinglePrompt(prompt)} title="Ver" />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'chapter_backups' && (
                        <div className="card" style={{
                            padding: '8px'
                        }}>
                            <h3 style={{ color: '#aaa', marginBottom: '10px', textAlign: 'center', fontSize: '0.75rem' }}>Respaldos por Capitulo</h3>
                            <AIBackupsTable chapters={chapters || []} />
                        </div>
                    )}
                </div>
            )}

            {selectedSinglePrompt && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(5px)'
                }}>
                    <div style={{
                        width: '92%',
                        maxWidth: '400px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid var(--accent-color, #ff4c4c)',
                        borderRadius: '10px',
                        padding: '16px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        boxShadow: '0 0 20px rgba(255, 76, 76, 0.15)'
                    }}>
                        <button
                            onClick={() => setSelectedSinglePrompt(null)}
                            style={{
                                position: 'absolute',
                                top: '10px', right: '12px',
                                background: 'transparent', border: 'none',
                                color: '#666', fontSize: '1.2rem', cursor: 'pointer',
                                zIndex: 1
                            }}
                        >
                            ✕
                        </button>

                        <h2 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '0.85rem', paddingRight: '24px' }}>
                            Detalle de Prompt
                        </h2>

                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                padding: '10px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h4 style={{ margin: 0, color: '#fff', fontSize: '0.75rem' }}>{selectedSinglePrompt.titulo}</h4>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedSinglePrompt.prompt)
                                            showToast("Prompt copiado con éxito")
                                        }}
                                        style={{
                                            fontSize: '0.6rem', background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid #444', color: '#ccc',
                                            padding: '3px 6px', borderRadius: '4px', cursor: 'pointer'
                                        }}
                                    >
                                        Copiar
                                    </button>
                                </div>
                                <div style={{
                                    background: '#000', padding: '8px',
                                    borderRadius: '4px', fontFamily: 'monospace',
                                    fontSize: '0.65rem', color: '#00ffcc',
                                    whiteSpace: 'pre-wrap', border: '1px solid rgba(0,255,204,0.1)',
                                    lineHeight: '1.4'
                                }}>
                                    {selectedSinglePrompt.prompt}
                                </div>
                                {selectedSinglePrompt.notas && (
                                    <p style={{ margin: '6px 0 0 0', fontSize: '0.65rem', color: '#888' }}>
                                        <strong>Notas:</strong> {selectedSinglePrompt.notas}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    color: 'var(--accent-color, #ff4c4c)',
                    padding: '8px 16px',
                    borderRadius: '50px',
                    zIndex: 9999,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255, 76, 76, 0.3)',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    pointerEvents: 'none',
                    animation: 'toastFadeIn 0.3s ease-out'
                }}>
                    ✨ {toast}
                </div>
            )}

            <style>{`
                @keyframes toastFadeIn {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .action-icon-btn:hover {
                    background-color: rgba(255, 255, 255, 0.08);
                    transform: scale(1.15);
                    filter: drop-shadow(0 0 5px currentColor);
                }
                .action-icon-btn:active {
                    transform: scale(0.95);
                }
            `}</style>
        </div>
    )
}

export default BackupsPage
