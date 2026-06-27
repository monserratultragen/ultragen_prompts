import { useState, useEffect } from 'react'
import axios from 'axios'
import { getImageUrl } from '../utils/imageUtils'
import AIBackupsTable from './AIBackupsTable'

const PREDEFINED_TAGS = [
    'leggins', 'bikini', 'latex', 'cuero', 'lencería',
    'vestido', 'jeans', 'casual', 'deportivo', 'bodysuit',
    'cyberpunk', 'futurista', 'gótico', 'neón', 'elegante',
    'retrato', 'primer plano', 'cuerpo entero',
    'interior', 'exterior', 'lluvia', 'noche', 'estudio'
]

const BackupsPage = ({ chapters }) => {
    const [activeTab, setActiveTab] = useState('chapter_backups')
    const [prompts, setPrompts] = useState([])
    const [images, setImages] = useState([])
    const [activeTags, setActiveTags] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
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
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)

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
        document.body.style.overflow = 'unset'
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const tabStyle = (isActive) => ({
        padding: isMobile ? '8px 6px' : '12px 24px',
        cursor: 'pointer',
        borderBottom: isActive ? '3px solid var(--accent-color, #ff4c4c)' : '3px solid transparent',
        color: isActive ? 'var(--accent-color, #ff4c4c)' : '#888',
        fontWeight: 'bold',
        fontSize: isMobile ? '0.65rem' : '0.9rem',
        transition: 'all 0.3s ease',
        background: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        outline: 'none',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        flex: isMobile ? '1' : '0 1 auto',
        textAlign: 'center',
        whiteSpace: 'nowrap'
    })

    const EyeIcon = () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    )

    const CopyIcon = () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
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
                padding: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                borderRadius: '50%',
                margin: '0 2px'
            }}
        >
            <Icon />
        </span>
    )

    const filteredAndSortedPrompts = prompts
        .filter(p => selectedCategory === 'all' || p.categoria === selectedCategory)
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
            <p>Cargando archivos clasificados...</p>
        </div>
    )

    return (
        <div className="container" style={{
            paddingTop: isMobile ? '20px' : '40px',
            paddingBottom: '150px',
            position: 'relative'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: isMobile ? '10px' : '40px',
                paddingInline: '20px'
            }}>
                <h1 style={{ margin: 0, fontSize: isMobile ? '0.8rem' : '2rem', textAlign: 'center' }}>BACKUPS AI</h1>
            </div>

            <div style={{
                display: 'flex',
                gap: isMobile ? '5px' : '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: isMobile ? '25px' : '40px',
                flexWrap: 'wrap',
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

            {error && <div style={{ color: '#ff4d4d', textAlign: 'center', padding: '40px' }}>{error}</div>}

            {!error && (
                <div>
                    {activeTab === 'base_images' && (
                        <div>
                            <h3 style={{ color: '#aaa', marginBottom: '20px', textAlign: 'center', fontSize: isMobile ? '1rem' : '1.1rem' }}>Galeria de imagenes</h3>
                            {images.length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>No hay imagenes registradas aun.</p>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))',
                                    gap: isMobile ? '10px' : '20px',
                                    justifyContent: 'center'
                                }}>
                                    {images.map(item => (
                                        <div key={item.id} style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'transform 0.2s',
                                        }}
                                            onMouseOver={(e) => !isMobile && (e.currentTarget.style.transform = 'scale(1.02)')}
                                            onMouseOut={(e) => !isMobile && (e.currentTarget.style.transform = 'scale(1)')}
                                        >
                                            <div style={{ width: '100%', height: isMobile ? '200px' : '270px', backgroundColor: '#111', overflow: 'hidden' }}>
                                                {item.imagen ? (
                                                    <img
                                                        src={getImageUrl(item.imagen)}
                                                        alt={item.titulo}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.8rem' }}>Sin imagen</div>
                                                )}
                                            </div>
                                            <div style={{ padding: isMobile ? '8px' : '12px' }}>
                                                <h4 style={{ color: '#fff', fontSize: isMobile ? '0.8rem' : '0.95rem', margin: '0 0 5px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.titulo}</h4>
                                                {item.notas && <p style={{ color: '#888', fontSize: '0.75rem', margin: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.notas}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'featured_prompts' && (
                        <div>
                            <h3 style={{ color: '#aaa', marginBottom: '20px', textAlign: 'center' }}>Lista de Prompts AI</h3>

                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '10px',
                                justifyContent: 'center',
                                marginBottom: '30px',
                                padding: '0 10px'
                            }}>
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        border: '1px solid',
                                        borderColor: selectedCategory === 'all' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                                        backgroundColor: selectedCategory === 'all' ? 'rgba(255, 76, 76, 0.1)' : 'transparent',
                                        color: selectedCategory === 'all' ? 'var(--accent-color)' : '#888',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontWeight: selectedCategory === 'all' ? 'bold' : 'normal'
                                    }}
                                >
                                    Todos
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            border: '1px solid',
                                            borderColor: selectedCategory === cat.id ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                                            backgroundColor: selectedCategory === cat.id ? 'rgba(255, 76, 76, 0.1)' : 'transparent',
                                            color: selectedCategory === cat.id ? 'var(--accent-color)' : '#888',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            fontWeight: selectedCategory === cat.id ? 'bold' : 'normal'
                                        }}
                                    >
                                        {cat.nombre}
                                    </button>
                                ))}
                            </div>

                            <div style={{
                                marginBottom: isMobile ? '12px' : '20px',
                                padding: isMobile ? '0 4px' : '0 10px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: isMobile ? '5px' : '8px',
                                    flexWrap: 'wrap',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: '10px',
                                    padding: isMobile ? '8px 10px' : '12px 14px',
                                }}>
                                    <span style={{
                                        fontSize: isMobile ? '0.58rem' : '0.65rem',
                                        color: '#555',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        whiteSpace: 'nowrap',
                                        marginRight: '2px',
                                        paddingTop: '4px',
                                        width: isMobile ? '100%' : 'auto',
                                        marginBottom: isMobile ? '4px' : '0'
                                    }}>
                                        🏷️ filtros rápidos
                                    </span>
                                    {PREDEFINED_TAGS.map(tag => {
                                        const isActive = activeTags.includes(tag)
                                        return (
                                            <button
                                                key={tag}
                                                onClick={() => setActiveTags(prev =>
                                                    isActive ? prev.filter(t => t !== tag) : [...prev, tag]
                                                )}
                                                style={{
                                                    padding: isMobile ? '3px 8px' : '3px 10px',
                                                    borderRadius: '50px',
                                                    border: `1px solid ${isActive ? 'var(--accent-color, #ff4c4c)' : 'rgba(255,255,255,0.1)'}`,
                                                    backgroundColor: isActive ? 'rgba(255,76,76,0.15)' : 'transparent',
                                                    color: isActive ? 'var(--accent-color, #ff4c4c)' : '#666',
                                                    fontSize: isMobile ? '0.6rem' : '0.7rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    fontWeight: isActive ? '600' : 'normal',
                                                    boxShadow: isActive ? '0 0 8px rgba(255,76,76,0.25)' : 'none',
                                                    letterSpacing: '0.3px',
                                                    lineHeight: '1.4',
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
                                                padding: isMobile ? '3px 8px' : '3px 10px',
                                                borderRadius: '50px',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                backgroundColor: 'rgba(255,255,255,0.06)',
                                                color: '#aaa',
                                                fontSize: isMobile ? '0.58rem' : '0.65rem',
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
                                marginBottom: '15px',
                                padding: '0 10px',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span style={{ fontSize: '0.75rem', color: '#888' }}>Ordenar por:</span>
                                <select
                                    value={promptSortOrder}
                                    onChange={e => setPromptSortOrder(e.target.value)}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        color: '#ccc',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="created_desc" style={{background: '#111'}}>Creado (Más reciente)</option>
                                    <option value="created_asc" style={{background: '#111'}}>Creado (Más antiguo)</option>
                                    <option value="updated_desc" style={{background: '#111'}}>Editado (Más reciente)</option>
                                    <option value="updated_asc" style={{background: '#111'}}>Editado (Más antiguo)</option>
                                </select>
                            </div>

                            {filteredAndSortedPrompts.length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>No hay prompts en esta categoría.</p>
                            ) : (
                                <div style={{
                                    overflowX: 'auto',
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#eee', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                                        <thead style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                                            <tr>
                                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #333' }}>Título</th>
                                                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #333' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAndSortedPrompts.map(prompt => (
                                                <tr key={prompt.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <td style={{ padding: '12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <span style={{ color: 'var(--accent-color)' }}>{prompt.titulo}</span>
                                                            <span style={{
                                                                fontSize: '0.65rem',
                                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                color: '#666',
                                                                textTransform: 'uppercase',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                {prompt.categoria_nombre || 'sin categoría'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '8px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}>
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
                            padding: isMobile ? '12px' : '20px'
                        }}>
                            <h3 style={{ color: '#aaa', marginBottom: '25px', textAlign: 'center', fontSize: isMobile ? '1rem' : '1.1rem' }}>Respaldos por Capitulo</h3>
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
                        width: '90%',
                        maxWidth: '800px',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid var(--accent-color, #ff4c4c)',
                        borderRadius: '12px',
                        padding: '30px',
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        boxShadow: '0 0 30px rgba(255, 76, 76, 0.2)'
                    }}>
                        <button
                            onClick={() => setSelectedSinglePrompt(null)}
                            style={{
                                position: 'absolute',
                                top: '15px', right: '15px',
                                background: 'transparent', border: 'none',
                                color: '#666', fontSize: '1.5rem', cursor: 'pointer'
                            }}
                        >
                            ✕
                        </button>

                        <h2 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '1.4rem' }}>
                            Detalle de Prompt
                        </h2>

                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '15px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h4 style={{ margin: 0, color: '#fff' }}>{selectedSinglePrompt.titulo}</h4>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedSinglePrompt.prompt)
                                            showToast("Prompt copiado con éxito")
                                        }}
                                        style={{
                                            fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid #444', color: '#ccc',
                                            padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'
                                        }}
                                    >
                                        Copiar
                                    </button>
                                </div>
                                <div style={{
                                    background: '#000', padding: '12px',
                                    borderRadius: '4px', fontFamily: 'monospace',
                                    fontSize: '0.85rem', color: '#00ffcc',
                                    whiteSpace: 'pre-wrap', border: '1px solid rgba(0,255,204,0.1)'
                                }}>
                                    {selectedSinglePrompt.prompt}
                                </div>
                                {selectedSinglePrompt.notas && (
                                    <p style={{ margin: '10px 0 0 0', fontSize: '0.8rem', color: '#888' }}>
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
                    bottom: '30px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    color: 'var(--accent-color, #ff4c4c)',
                    padding: '12px 24px',
                    borderRadius: '50px',
                    zIndex: 9999,
                    boxShadow: '0 5px 20px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255, 76, 76, 0.3)',
                    fontSize: '0.95rem',
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
