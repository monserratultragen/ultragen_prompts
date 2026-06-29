import { useState, useEffect } from 'react'
import axios from 'axios'

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
    const [copiedId, setCopiedId] = useState(null)
    const [activeTags, setActiveTags] = useState([])

    const showToast = (message) => {
        setToast(message)
        setTimeout(() => setToast(null), 1500)
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    useEffect(() => {
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

    if (initialLoading) return <div style={{ color: '#888', textAlign: 'center', padding: '12px', fontSize: '0.7rem' }}>Analizando respaldos...</div>

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
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', fontSize: '0.65rem', color: '#888', flexWrap: 'wrap' }}>
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
                    <th key={col} style={{ padding: '8px 6px', textAlign: col === 'Acción' || col === 'Acciones' ? 'center' : 'left', borderBottom: '1px solid #333', fontSize: '0.65rem' }}>{col}</th>
                ))}
            </tr>
        </thead>
    )

    const EyeIcon = () => (
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    )

    const MoveIcon = () => (
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            <line x1="12" y1="11" x2="12" y2="17"></line>
            <polyline points="9 14 12 17 15 14"></polyline>
        </svg>
    )

    const CopyIcon = () => (
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
    )
    const CheckIcon = () => (
        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
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
                    width: '92%', maxWidth: '400px', backgroundColor: '#1a1a1a',
                    border: '1px solid #444', borderRadius: '10px', padding: '16px',
                    maxHeight: '90vh', display: 'flex', flexDirection: 'column'
                }}>
                    <h3 style={{ color: 'var(--accent-color)', marginTop: 0, marginBottom: '10px', fontSize: '0.8rem' }}>Seleccionar Destino</h3>

                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', padding: '6px', backgroundColor: '#000', borderRadius: '6px' }}>
                        {Object.entries(treeData).sort((a, b) => a[1].orden - b[1].orden).map(([dName, dData]) => (
                            <div key={dName} style={{ marginBottom: '3px' }}>
                                <div onClick={() => toggleDiario(dName)} style={{ cursor: 'pointer', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '3px' }}>
                                    <span>{expandedDiarios[dName] ? '▼' : '▶'}</span>
                                    <span>📁 {dName}</span>
                                </div>
                                {expandedDiarios[dName] && (
                                    <div style={{ marginLeft: '16px', borderLeft: '1px solid #333' }}>
                                        {Object.entries(dData.tomos).sort((a, b) => a[1].orden - b[1].orden).map(([tName, tData]) => (
                                            <div key={tName}>
                                                <div onClick={() => toggleTomo(tName)} style={{ cursor: 'pointer', color: '#ccc', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '3px' }}>
                                                    <span>{expandedTomos[tName] ? '▼' : '▶'}</span>
                                                    <span>📂 {tName}</span>
                                                </div>
                                                {expandedTomos[tName] && (
                                                    <div style={{ marginLeft: '16px' }}>
                                                        {tData.chapters.map(cap => (
                                                            <div
                                                                key={cap.id}
                                                                onClick={() => setSelectedDest(cap)}
                                                                style={{
                                                                    cursor: 'pointer',
                                                                    padding: '3px 6px',
                                                                    fontSize: '0.65rem',
                                                                    color: selectedDest?.id === cap.id ? 'var(--accent-color)' : '#999',
                                                                    backgroundColor: selectedDest?.id === cap.id ? 'rgba(255,76,76,0.1)' : 'transparent',
                                                                    borderRadius: '3px'
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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button onClick={onCancel} style={{ padding: '6px 12px', background: 'none', border: '1px solid #444', color: '#888', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>Cancelar</button>
                        <button
                            onClick={() => onSelect(selectedDest)}
                            disabled={!selectedDest}
                            style={{
                                padding: '6px 12px',
                                background: selectedDest ? 'var(--accent-color)' : '#333',
                                border: 'none', color: '#fff', borderRadius: '4px', cursor: selectedDest ? 'pointer' : 'not-allowed',
                                fontSize: '0.65rem'
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
        <div style={{ padding: '4px 0', minHeight: '300px' }}>
            <h3 style={{
                color: 'var(--accent-color, #ff4c4c)',
                marginBottom: '6px',
                fontSize: '0.75rem',
                borderBottom: '1px solid rgba(255, 76, 76, 0.3)',
                paddingBottom: '6px',
                textAlign: 'center'
            }}>
                Gestión de Backups
            </h3>

            <Breadcrumbs />

            {movingPrompt && (
                <TreeSelector
                    onSelect={confirmMove}
                    onCancel={() => setMovingPrompt(null)}
                />
            )}

            {viewLevel === 'prompts' && (<></>)}

            <div style={{
                overflowX: 'auto',
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '12px'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#eee', fontSize: '0.7rem' }}>
                    {viewLevel === 'diarios' && (
                        <>
                            <TableHeader columns={['Diario']} />
                            <tbody>
                                {uniqueDiarios.map(d => (
                                    <tr key={d} onClick={() => selectDiario(d)} style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '8px 6px', fontSize: '0.7rem' }}>{d}</td>
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
                                        <td style={{ padding: '8px 6px', fontSize: '0.7rem' }}>{t}</td>
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
                                        <td style={{ padding: '8px 6px', fontSize: '0.7rem' }}>{cap.nombre}</td>
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
                                    <tr><td colSpan="2" style={{ textAlign: 'center', padding: '12px', fontSize: '0.7rem' }}>Cargando...</td></tr>
                                ) : (() => {
                                    const filteredPrompts = prompts.filter(p => {
                                        if (activeTags.length === 0) return true
                                        const text = `${p.titulo} ${p.prompt} ${p.notas || ''}`.toLowerCase()
                                        return activeTags.every(tag => text.includes(tag.toLowerCase()))
                                    })
                                    if (filteredPrompts.length === 0) return (
                                        <tr><td colSpan="2" style={{ textAlign: 'center', padding: '12px', color: '#666', fontSize: '0.7rem' }}>
                                            {prompts.length === 0 ? 'Sin prompts en este capítulo.' : 'Ningún prompt coincide con los tags seleccionados.'}
                                        </td></tr>
                                    )
                                    return filteredPrompts.map(p => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '6px 6px', fontSize: '0.7rem' }}>{p.titulo}</td>
                                            <td style={{ padding: '4px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                <IconButton icon={copiedId === p.id ? CheckIcon : CopyIcon} onClick={() => { navigator.clipboard.writeText(p.prompt); setCopiedId(p.id); setTimeout(() => setCopiedId(null), 2000) }} title={copiedId === p.id ? "Copiado" : "Copiar"} color={copiedId === p.id ? "#4caf50" : "#00ffcc"} />
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
                            onClick={() => { setSelectedChapterPrompts(null); setSelectedSinglePrompt(null) }}
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
                            {selectedSinglePrompt ? 'Detalle de Prompt' : `Prompts: ${selectedChapterPrompts?.nombre}`}
                        </h2>

                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                            {loading ? (
                                <p style={{ textAlign: 'center', color: '#888', fontSize: '0.7rem' }}>Cargando...</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {(selectedSinglePrompt ? [selectedSinglePrompt] : prompts).map(p => (
                                        <div key={p.id} style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '6px',
                                            padding: '10px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <h4 style={{ margin: 0, color: '#fff', fontSize: '0.7rem' }}>{p.titulo}</h4>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(p.prompt)
                                                        setCopiedId('modal')
                                                        setTimeout(() => setCopiedId(null), 2000)
                                                    }}
                                                    style={{
                                                        fontSize: '0.6rem', background: copiedId === 'modal' ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.1)',
                                                        border: `1px solid ${copiedId === 'modal' ? '#4caf50' : '#444'}`,
                                                        color: copiedId === 'modal' ? '#4caf50' : '#ccc',
                                                        padding: '3px 6px', borderRadius: '4px', cursor: 'pointer'
                                                    }}
                                                >
                                                    {copiedId === 'modal' ? '✓ Copiado' : 'Copiar'}
                                                </button>
                                            </div>
                                            <div style={{
                                                background: '#000', padding: '8px',
                                                borderRadius: '4px', fontFamily: 'monospace',
                                                fontSize: '0.6rem', color: '#00ffcc',
                                                whiteSpace: 'pre-wrap', border: '1px solid rgba(0,255,204,0.1)',
                                                lineHeight: '1.4'
                                            }}>
                                                {p.prompt}
                                            </div>
                                            {p.notas && (
                                                <p style={{ margin: '6px 0 0 0', fontSize: '0.6rem', color: '#888' }}>
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
                    top: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    color: 'var(--accent-color, #ff4c4c)',
                    border: '1px solid var(--accent-color, #ff4c4c)',
                    padding: '6px 14px',
                    borderRadius: '50px',
                    fontSize: '0.65rem',
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
