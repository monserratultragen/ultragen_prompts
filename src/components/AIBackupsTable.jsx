import { useState, useEffect } from 'react'
import axios from 'axios'

const PREDEFINED_TAGS = [
    'leggins', 'bikini', 'latex', 'cuero', 'lencería',
    'vestido', 'jeans', 'casual', 'deportivo', 'bodysuit',
    'cyberpunk', 'futurista', 'gótico', 'neón', 'elegante',
    'retrato', 'primer plano', 'cuerpo entero',
    'interior', 'exterior', 'lluvia', 'noche', 'estudio'
]

const AIBackupsTable = ({ chapters }) => {
    const [selectedChapterPrompts, setSelectedChapterPrompts] = useState(null)
    const [prompts, setPrompts] = useState([])
    const [loading, setLoading] = useState(false)
    const [filteredChapters, setFilteredChapters] = useState([])
    const [initialLoading, setInitialLoading] = useState(true)
    const [viewLevel, setViewLevel] = useState('diarios')
    const [selectedDiario, setSelectedDiario] = useState(null)
    const [selectedTomo, setSelectedTomo] = useState(null)
    const [selectedChapter, setSelectedChapter] = useState(null)
    const [selectedSinglePrompt, setSelectedSinglePrompt] = useState(null)
    const [movingPrompt, setMovingPrompt] = useState(null)
    const [toast, setToast] = useState(null)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [activeTags, setActiveTags] = useState([])

    const showToast = (message) => {
        setToast(message)
        setTimeout(() => setToast(null), 1500)
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)

        const fetchExistingPrompts = async () => {
            try {
                const res = await axios.get(`${apiUrl}/api/capitulo-prompts/`)
                const chapterIdsWithPrompts = new Set(res.data.map(p => p.capitulo))

                const filtered = chapters
                    .filter(cap => chapterIdsWithPrompts.has(cap.id))
                    .sort((a, b) => {
                        const d_a = (a.diario_orden || 0) - 1
                        const d_b = (b.diario_orden || 0) - 1
                        if (d_a !== d_b) return d_a - d_b

                        const t_a = a.tomo_orden || 0
                        const t_b = b.tomo_orden || 0
                        if (t_a !== t_b) return t_a - t_b

                        return (a.nombre || '').localeCompare(b.nombre || '')
                    })

                setFilteredChapters(filtered)
            } catch (err) {
                console.error("Error identifying chapters with prompts:", err)
            } finally {
                setInitialLoading(false)
            }
        }

        if (chapters && chapters.length > 0) {
            fetchExistingPrompts()
        } else {
            setInitialLoading(false)
        }

        return () => window.removeEventListener('resize', handleResize)
    }, [chapters, apiUrl])

    const goToDiarios = () => {
        setViewLevel('diarios')
        setSelectedDiario(null)
        setSelectedTomo(null)
        setSelectedChapter(null)
    }

    const selectDiario = (diarioName) => {
        setSelectedDiario(diarioName)
        setViewLevel('tomos')
    }

    const selectTomo = (tomoName) => {
        setSelectedTomo(tomoName)
        setViewLevel('chapters')
    }

    const selectChapter = async (chapter) => {
        setSelectedChapter(chapter)
        setLoading(true)
        try {
            const res = await axios.get(`${apiUrl}/api/capitulo-prompts/?capitulo=${chapter.id}`)
            setPrompts(res.data)
            setViewLevel('prompts')
        } catch (err) {
            console.error("Error fetching prompts:", err)
            showToast("Error al cargar los prompts")
        } finally {
            setLoading(false)
        }
    }

    const handleMovePrompt = (prompt) => {
        setMovingPrompt(prompt)
    }

    const confirmMove = async (targetChapter) => {
        if (!movingPrompt) return
        try {
            await axios.patch(`${apiUrl}/api/capitulo-prompts/${movingPrompt.id}/`, {
                capitulo: targetChapter.id
            })
            showToast("Prompt movido con éxito")
            setMovingPrompt(null)
            if (viewLevel === 'prompts') {
                selectChapter(selectedChapter)
            }
        } catch (err) {
            console.error("Error moving prompt:", err)
            showToast("No se pudo mover el prompt")
        }
    }

    if (initialLoading) return <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Analizando respaldos...</div>

    const uniqueDiarios = [...new Set(filteredChapters.map(cap => cap.diario_nombre))].sort((a, b) => {
        const d_a = filteredChapters.find(c => c.diario_nombre === a)
        const d_b = filteredChapters.find(c => c.diario_nombre === b)
        return (d_a?.diario_orden || 0) - (d_b?.diario_orden || 0)
    })

    const tomosInDiario = selectedDiario
        ? [...new Set(filteredChapters.filter(c => c.diario_nombre === selectedDiario).map(c => c.tomo_nombre))].sort((a, b) => {
            const t_a = filteredChapters.find(c => c.diario_nombre === selectedDiario && c.tomo_nombre === a)
            const t_b = filteredChapters.find(c => c.diario_nombre === selectedDiario && c.tomo_nombre === b)
            return (t_a?.tomo_orden || 0) - (t_b?.tomo_orden || 0)
        })
        : []

    const chaptersInTomo = selectedTomo
        ? filteredChapters.filter(c => c.diario_nombre === selectedDiario && c.tomo_nombre === selectedTomo)
        : []

    const Breadcrumbs = () => (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', fontSize: '0.85rem', color: '#888', flexWrap: 'wrap' }}>
            <span onClick={goToDiarios} style={{ cursor: 'pointer', color: viewLevel === 'diarios' ? 'var(--accent-color)' : 'inherit' }}>Inicio</span>
            {selectedDiario && (
                <>
                    <span>/</span>
                    <span onClick={() => { setViewLevel('tomos'); setSelectedTomo(null); setSelectedChapter(null) }} style={{ cursor: 'pointer', color: viewLevel === 'tomos' ? 'var(--accent-color)' : 'inherit' }}>{selectedDiario}</span>
                </>
            )}
            {selectedTomo && (
                <>
                    <span>/</span>
                    <span onClick={() => { setViewLevel('chapters'); setSelectedChapter(null) }} style={{ cursor: 'pointer', color: viewLevel === 'chapters' ? 'var(--accent-color)' : 'inherit' }}>{selectedTomo}</span>
                </>
            )}
            {selectedChapter && (
                <>
                    <span>/</span>
                    <span style={{ color: 'var(--accent-color)' }}>{selectedChapter.nombre}</span>
                </>
            )}
        </div>
    )

    const TableHeader = ({ columns }) => (
        <thead style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <tr>
                {columns.map(col => (
                    <th key={col} style={{ padding: '12px', textAlign: col === 'Acción' || col === 'Acciones' ? 'center' : 'left', borderBottom: '1px solid #333' }}>{col}</th>
                ))}
            </tr>
        </thead>
    )

    const EyeIcon = () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    )

    const MoveIcon = () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            <line x1="12" y1="11" x2="12" y2="17"></line>
            <polyline points="9 14 12 17 15 14"></polyline>
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

    const TreeSelector = ({ onSelect, onCancel }) => {
        const [expandedDiarios, setExpandedDiarios] = useState({})
        const [expandedTomos, setExpandedTomos] = useState({})
        const [selectedDest, setSelectedDest] = useState(null)

        const treeData = chapters.reduce((acc, cap) => {
            if (!acc[cap.diario_nombre]) acc[cap.diario_nombre] = { orden: cap.diario_orden, tomos: {} }
            if (!acc[cap.diario_nombre].tomos[cap.tomo_nombre]) acc[cap.diario_nombre].tomos[cap.tomo_nombre] = { orden: cap.tomo_orden, chapters: [] }
            acc[cap.diario_nombre].tomos[cap.tomo_nombre].chapters.push(cap)
            return acc
        }, {})

        const toggleDiario = (d) => setExpandedDiarios(prev => ({ ...prev, [d]: !prev[d] }))
        const toggleTomo = (t) => setExpandedTomos(prev => ({ ...prev, [t]: !prev[t] }))

        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex',
                alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)'
            }}>
                <div style={{
                    width: '90%', maxWidth: '500px', backgroundColor: '#1a1a1a',
                    border: '1px solid #444', borderRadius: '12px', padding: '25px',
                    maxHeight: '80vh', display: 'flex', flexDirection: 'column'
                }}>
                    <h3 style={{ color: 'var(--accent-color)', marginTop: 0, marginBottom: '20px' }}>Seleccionar Destino</h3>

                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', padding: '10px', backgroundColor: '#000', borderRadius: '8px' }}>
                        {Object.entries(treeData).sort((a, b) => a[1].orden - b[1].orden).map(([dName, dData]) => (
                            <div key={dName} style={{ marginBottom: '5px' }}>
                                <div onClick={() => toggleDiario(dName)} style={{ cursor: 'pointer', color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px' }}>
                                    <span>{expandedDiarios[dName] ? '▼' : '▶'}</span>
                                    <span>📁 {dName}</span>
                                </div>
                                {expandedDiarios[dName] && (
                                    <div style={{ marginLeft: '20px', borderLeft: '1px solid #333' }}>
                                        {Object.entries(dData.tomos).sort((a, b) => a[1].orden - b[1].orden).map(([tName, tData]) => (
                                            <div key={tName}>
                                                <div onClick={() => toggleTomo(tName)} style={{ cursor: 'pointer', color: '#ccc', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px' }}>
                                                    <span>{expandedTomos[tName] ? '▼' : '▶'}</span>
                                                    <span>📂 {tName}</span>
                                                </div>
                                                {expandedTomos[tName] && (
                                                    <div style={{ marginLeft: '20px' }}>
                                                        {tData.chapters.map(cap => (
                                                            <div
                                                                key={cap.id}
                                                                onClick={() => setSelectedDest(cap)}
                                                                style={{
                                                                    cursor: 'pointer',
                                                                    padding: '4px 8px',
                                                                    fontSize: '0.8rem',
                                                                    color: selectedDest?.id === cap.id ? 'var(--accent-color)' : '#999',
                                                                    backgroundColor: selectedDest?.id === cap.id ? 'rgba(255,76,76,0.1)' : 'transparent',
                                                                    borderRadius: '4px'
                                                                }}
                                                            >
                                                                📄 {cap.nombre}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button onClick={onCancel} style={{ padding: '8px 16px', background: 'none', border: '1px solid #444', color: '#888', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                        <button
                            onClick={() => onSelect(selectedDest)}
                            disabled={!selectedDest}
                            style={{
                                padding: '8px 16px',
                                background: selectedDest ? 'var(--accent-color)' : '#333',
                                border: 'none', color: '#fff', borderRadius: '4px', cursor: selectedDest ? 'pointer' : 'not-allowed'
                            }}
                        >
                            Mover Aquí
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{ padding: '10px 0', minHeight: '400px' }}>
            <h3 style={{
                color: 'var(--accent-color, #ff4c4c)',
                marginBottom: '10px',
                fontSize: isMobile ? '1.1rem' : '1.4rem',
                borderBottom: '1px solid rgba(255, 76, 76, 0.3)',
                paddingBottom: '10px',
                textAlign: 'center'
            }}>
                Gestión de Backups por Estructura
            </h3>

            <Breadcrumbs />

            {movingPrompt && (
                <TreeSelector
                    onSelect={confirmMove}
                    onCancel={() => setMovingPrompt(null)}
                />
            )}

            {viewLevel === 'prompts' && (
                <div style={{ marginBottom: '14px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                    }}>
                        <span style={{ fontSize: '0.62rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap', marginRight: '4px' }}>
                            🏷️ filtros
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
                                        padding: '3px 10px',
                                        borderRadius: '50px',
                                        border: `1px solid ${isActive ? 'var(--accent-color, #ff4c4c)' : 'rgba(255,255,255,0.1)'}`,
                                        backgroundColor: isActive ? 'rgba(255,76,76,0.15)' : 'transparent',
                                        color: isActive ? 'var(--accent-color, #ff4c4c)' : '#666',
                                        fontSize: isMobile ? '0.62rem' : '0.7rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontWeight: isActive ? '600' : 'normal',
                                        boxShadow: isActive ? '0 0 8px rgba(255,76,76,0.25)' : 'none',
                                        letterSpacing: '0.3px',
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
                                    padding: '3px 10px',
                                    borderRadius: '50px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                    color: '#aaa',
                                    fontSize: '0.62rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    marginLeft: 'auto',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                ✕ limpiar ({activeTags.length})
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div style={{
                overflowX: 'auto',
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '20px'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#eee', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                    {viewLevel === 'diarios' && (
                        <>
                            <TableHeader columns={['Diario']} />
                            <tbody>
                                {uniqueDiarios.map(d => (
                                    <tr key={d} onClick={() => selectDiario(d)} style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '12px' }}>{d}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </>
                    )}

                    {viewLevel === 'tomos' && (
                        <>
                            <TableHeader columns={['Tomo']} />
                            <tbody>
                                {tomosInDiario.map(t => (
                                    <tr key={t} onClick={() => selectTomo(t)} style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '12px' }}>{t}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </>
                    )}

                    {viewLevel === 'chapters' && (
                        <>
                            <TableHeader columns={['Capítulo']} />
                            <tbody>
                                {chaptersInTomo.map(cap => (
                                    <tr key={cap.id} onClick={() => selectChapter(cap)} style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '12px' }}>{cap.nombre}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </>
                    )}

                    {viewLevel === 'prompts' && (
                        <>
                            <TableHeader columns={['Título', 'Acciones']} />
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="2" style={{ textAlign: 'center', padding: '20px' }}>Cargando...</td></tr>
                                ) : (() => {
                                    const filteredPrompts = prompts.filter(p => {
                                        if (activeTags.length === 0) return true
                                        const text = `${p.titulo} ${p.prompt} ${p.notas || ''}`.toLowerCase()
                                        return activeTags.every(tag => text.includes(tag.toLowerCase()))
                                    })
                                    if (filteredPrompts.length === 0) return (
                                        <tr><td colSpan="2" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                            {prompts.length === 0 ? 'Sin prompts en este capítulo.' : 'Ningún prompt coincide con los tags seleccionados.'}
                                        </td></tr>
                                    )
                                    return filteredPrompts.map(p => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '12px' }}>{p.titulo}</td>
                                            <td style={{ padding: '8px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                <IconButton icon={CopyIcon} onClick={() => { navigator.clipboard.writeText(p.prompt); showToast("Prompt copiado") }} title="Copiar" color="#00ffcc" />
                                                <IconButton icon={EyeIcon} onClick={() => { setSelectedSinglePrompt(p) }} title="Ver" />
                                                <IconButton icon={MoveIcon} onClick={() => handleMovePrompt(p)} color="#888" title="Mover" />
                                            </td>
                                        </tr>
                                    ))
                                })()}
                            </tbody>
                        </>
                    )}
                </table>
            </div>

            {(selectedChapterPrompts || selectedSinglePrompt) && (
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
                            onClick={() => { setSelectedChapterPrompts(null); setSelectedSinglePrompt(null) }}
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
                            {selectedSinglePrompt ? 'Detalle de Prompt' : `Prompts: ${selectedChapterPrompts.nombre}`}
                        </h2>

                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                            {loading ? (
                                <p style={{ textAlign: 'center', color: '#888' }}>Cargando...</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {(selectedSinglePrompt ? [selectedSinglePrompt] : prompts).map(p => (
                                        <div key={p.id} style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            padding: '15px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <h4 style={{ margin: 0, color: '#fff' }}>{p.titulo}</h4>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(p.prompt)
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
                                                {p.prompt}
                                            </div>
                                            {p.notas && (
                                                <p style={{ margin: '10px 0 0 0', fontSize: '0.8rem', color: '#888' }}>
                                                    <strong>Notas:</strong> {p.notas}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    color: 'var(--accent-color, #ff4c4c)',
                    border: '1px solid var(--accent-color, #ff4c4c)',
                    padding: '10px 20px',
                    borderRadius: '50px',
                    fontSize: '0.9rem',
                    zIndex: 9999,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(5px)',
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

export default AIBackupsTable
