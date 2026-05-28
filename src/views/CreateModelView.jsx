/**
 * CONSTRUCTOR 2D - MODELOS PROPIOS
 * El usuario coloca piezas en SVG (frente y lateral). Cada pieza tiene:
 * name, length, thickness, depth, orientation, posicion x/y.
 * Al guardar: onAddProject -> App.handleAddCustomProject -> BD (modelos_propios).
 * El PDF NO recalcula: usa esas piezas en generateCustomModelPdf (App.jsx).
 */
import { useEffect, useMemo, useRef, useState } from 'react'

const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 420
const BOARD_THICKNESS = 18
const DEFAULT_DEPTH = 300

const ORIENTATION_LABELS = {
  vertical: 'Vertical',
  horizontal: 'Horizontal',
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getPieceDimensions({ orientation, length, depth, view }) {
  if (view === 'side') {
    return orientation === 'vertical'
      ? { width: depth, height: length }
      : { width: depth, height: BOARD_THICKNESS }
  }

  return orientation === 'vertical'
    ? { width: BOARD_THICKNESS, height: length }
    : { width: length, height: BOARD_THICKNESS }
}

function createBoardPiece({ name, orientation, length, depth }, index, view = 'front') {
  const safeLength = clamp(Number(length) || 200, 40, 600)
  const safeDepth = clamp(Number(depth) || DEFAULT_DEPTH, 40, 600)
  const dimensions = getPieceDimensions({
    orientation,
    length: safeLength,
    depth: safeDepth,
    view,
  })

  return {
    id: `board-${view}-${Date.now()}-${index}`,
    name: name.trim() || (orientation === 'vertical' ? 'Pieza vertical' : 'Pieza horizontal'),
    orientation,
    thickness: BOARD_THICKNESS,
    length: safeLength,
    depth: safeDepth,
    view,
    x: 90 + (index % 5) * 22,
    y: 72 + (index % 5) * 18,
    ...dimensions,
  }
}

function createSideProjection(frontPiece, index) {
  const sidePiece = createBoardPiece(frontPiece, index, 'side')
  return {
    ...sidePiece,
    id: `side-${frontPiece.id}`,
    linkedId: frontPiece.id,
    x: 96 + (index % 5) * 18,
    y: frontPiece.y,
  }
}

function getCanvasPieceLabel(piece, view) {
  if (view === 'side') {
    return piece.orientation === 'vertical'
      ? `${piece.depth} x ${piece.length}`
      : `${piece.depth} x 18`
  }

  return `${piece.length} x 18`
}

export default function CreateModelView({ initialProject = null, onAddProject }) {
  const [modelName, setModelName] = useState(initialProject?.name || 'Mueble nuevo')
  const [activeView, setActiveView] = useState('front')
  const [piecesByView, setPiecesByView] = useState({
    front: initialProject?.measures?.pieces || [],
    side: initialProject?.measures?.sidePieces || [],
  })
  const [selectedId, setSelectedId] = useState(null)
  const [interaction, setInteraction] = useState(null)
  const [newPiece, setNewPiece] = useState({
    name: 'Tablero',
    orientation: 'vertical',
    length: 220,
    depth: DEFAULT_DEPTH,
  })
  const frontCanvasRef = useRef(null)
  const sideCanvasRef = useRef(null)
  const canvasRefs = {
    front: frontCanvasRef,
    side: sideCanvasRef,
  }

  useEffect(() => {
    setModelName(initialProject?.name || 'Mueble nuevo')
    setPiecesByView({
      front: initialProject?.measures?.pieces || [],
      side: initialProject?.measures?.sidePieces || [],
    })
    setSelectedId(null)
    setActiveView('front')
  }, [initialProject])

  const selectedPiece = piecesByView[activeView].find((piece) => piece.id === selectedId)
  const isSideSelection = activeView === 'side'
  const pieceCount = piecesByView.front.length

  const piecesSummary = useMemo(() => {
    return piecesByView.front.reduce((summary, piece) => {
      const key = `${ORIENTATION_LABELS[piece.orientation]} ${piece.length} x ${piece.thickness} x ${piece.depth} mm`
      summary[key] = (summary[key] || 0) + 1
      return summary
    }, {})
  }, [piecesByView])

  const getCanvasPoint = (event, view = activeView) => {
    const rect = canvasRefs[view].current.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    }
  }

  const updatePiece = (view, pieceId, updater) => {
    setPiecesByView((previous) => ({
      ...previous,
      [view]: previous[view].map((piece) =>
        piece.id === pieceId ? updater(piece) : piece,
      ),
    }))
  }

  const syncLinkedPiece = (previous, view, updatedPiece) => {
    const linkedView = view === 'front' ? 'side' : 'front'
    const linkedId = updatedPiece.linkedId || updatedPiece.id

    return {
      ...previous,
      [linkedView]: previous[linkedView].map((piece) => {
        const isLinked = piece.id === updatedPiece.linkedId || piece.linkedId === linkedId
        if (!isLinked) return piece

        const nextPiece = {
          ...piece,
          name: updatedPiece.name,
          orientation: updatedPiece.orientation,
          length: updatedPiece.length,
          depth: updatedPiece.depth,
          y: updatedPiece.y,
        }
        const dimensions = getPieceDimensions(nextPiece)
        return {
          ...nextPiece,
          ...dimensions,
          x: clamp(nextPiece.x, 0, CANVAS_WIDTH - dimensions.width),
          y: clamp(nextPiece.y, 0, CANVAS_HEIGHT - dimensions.height),
        }
      }),
    }
  }

  const updatePieceWithLinked = (view, pieceId, updater) => {
    setPiecesByView((previous) => {
      let updatedPiece = null
      const nextPieces = previous[view].map((piece) => {
        if (piece.id !== pieceId) return piece
        updatedPiece = updater(piece)
        return updatedPiece
      })
      const nextState = { ...previous, [view]: nextPieces }
      return updatedPiece?.linkedId ? syncLinkedPiece(nextState, view, updatedPiece) : nextState
    })
  }

  const addPiece = () => {
    setPiecesByView((previous) => {
      const nextPiece = createBoardPiece(newPiece, previous.front.length, 'front')
      const sideProjection = createSideProjection(nextPiece, previous.side.length)
      const linkedFrontPiece = sideProjection
        ? { ...nextPiece, linkedId: sideProjection.id }
        : nextPiece
      setSelectedId(nextPiece.id)
      return {
        ...previous,
        front: [...previous.front, linkedFrontPiece],
        side: [...previous.side, sideProjection],
      }
    })
  }

  const updateSelectedPiece = (changes) => {
    if (!selectedPiece || isSideSelection) return

    updatePieceWithLinked('front', selectedPiece.id, (piece) => {
      const nextPiece = {
        ...piece,
        ...changes,
      }
      const dimensions = getPieceDimensions(nextPiece)
      return {
        ...nextPiece,
        ...dimensions,
        x: clamp(nextPiece.x, 0, CANVAS_WIDTH - dimensions.width),
        y: clamp(nextPiece.y, 0, CANVAS_HEIGHT - dimensions.height),
      }
    })
  }

  const deleteSelectedPiece = () => {
    if (!selectedId) return
    setPiecesByView((previous) => ({
      ...previous,
      front: previous.front.filter((piece) => piece.id !== selectedId && piece.linkedId !== selectedId),
      side: previous.side.filter((piece) => piece.id !== selectedId && piece.linkedId !== selectedId),
    }))
    setSelectedId(null)
  }

  const clearActiveView = () => {
    setPiecesByView({ front: [], side: [] })
    setSelectedId(null)
  }

  const startDrag = (event, view, piece) => {
    event.stopPropagation()
    const point = getCanvasPoint(event, view)
    setActiveView(view)
    setSelectedId(piece.id)
    setInteraction({
      type: 'drag',
      view,
      pieceId: piece.id,
      startX: point.x,
      startY: point.y,
      original: piece,
    })
  }

  const startResize = (event, view, piece) => {
    event.stopPropagation()
    if (view !== 'front') return
    const point = getCanvasPoint(event, view)
    setActiveView('front')
    setSelectedId(piece.id)
    setInteraction({
      type: 'resize',
      view,
      pieceId: piece.id,
      startX: point.x,
      startY: point.y,
      original: piece,
    })
  }

  useEffect(() => {
    if (!interaction) return undefined

    const handlePointerMove = (event) => {
      const point = getCanvasPoint(event, interaction.view)
      const deltaX = point.x - interaction.startX
      const deltaY = point.y - interaction.startY

      const updateDraggingPiece = interaction.view === 'front' ? updatePieceWithLinked : updatePiece

      updateDraggingPiece(interaction.view, interaction.pieceId, () => {
        if (interaction.type === 'resize') {
          const isVertical = interaction.original.orientation === 'vertical'
          const isSideView = interaction.view === 'side'
          const lengthDelta = isVertical ? deltaY : deltaX
          const length = clamp(interaction.original.length + lengthDelta, 40, 600)
          const depth = isSideView
            ? clamp(interaction.original.depth + deltaX, 40, 600)
            : interaction.original.depth
          const dimensions = getPieceDimensions({
            orientation: interaction.original.orientation,
            length: isSideView && !isVertical ? interaction.original.length : length,
            depth,
            view: interaction.original.view,
          })

          return {
            ...interaction.original,
            length: isSideView && !isVertical ? interaction.original.length : length,
            depth,
            ...dimensions,
          }
        }

        const x = clamp(interaction.original.x + deltaX, 0, CANVAS_WIDTH - interaction.original.width)
        const y = clamp(interaction.original.y + deltaY, 0, CANVAS_HEIGHT - interaction.original.height)
        return { ...interaction.original, x, y }
      })
    }

    const handlePointerUp = () => setInteraction(null)

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [interaction])

  /** Envia piezas al padre; se guardan en piezas_json / piezas_lado_json (PostgreSQL) */
  const addToProjects = (isFavorite = false) => {
    if (piecesByView.front.length === 0) {
      window.alert('Agrega al menos una pieza en la vista de frente.')
      return
    }

    onAddProject?.({
      name: modelName.trim() || 'Mueble nuevo',
      isFavorite,
      pieces: piecesByView.front,
      sidePieces: piecesByView.side,
    })
  }

  const renderCanvas = (view) => (
    <div className={`builder-canvas-card ${activeView === view ? 'active' : ''}`}>
      <div className="builder-canvas-title">
        <div>
          <p>{view === 'front' ? 'Vista de frente' : 'Vista lateral'}</p>
          <span>{piecesByView[view].length} piezas</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setActiveView(view)
            setSelectedId(null)
          }}
        >
          {view === 'front' ? 'Editar' : 'Acomodar'}
        </button>
      </div>

      <svg
        ref={canvasRefs[view]}
        className="builder-canvas"
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        role="img"
        aria-label={view === 'front' ? 'Lienzo vista de frente' : 'Lienzo vista lateral'}
        onPointerDown={() => {
          setActiveView(view)
          setSelectedId(null)
        }}
      >
        <defs>
          <pattern id={`grid-${view}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#ead8bd" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill={`url(#grid-${view})`} />
        <rect x="24" y="24" width="592" height="372" fill="none" stroke="#c9a879" strokeDasharray="8 8" />

        {piecesByView[view].map((piece) => {
          const isSelected = view === 'front' && selectedId === piece.id
          return (
            <g
              key={piece.id}
              className={`builder-piece ${view === 'side' ? 'reactive' : ''} ${isSelected ? 'selected' : ''}`}
              onPointerDown={(event) => startDrag(event, view, piece)}
            >
              <rect
                x={piece.x}
                y={piece.y}
                width={piece.width}
                height={piece.height}
                rx="2"
                fill="#d3a06d"
                stroke={isSelected ? '#3b2418' : '#70472f'}
                strokeWidth={isSelected ? 3 : 1.5}
              />
              <text
                x={piece.x + piece.width / 2}
                y={piece.y + piece.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fill="#3b2418"
                pointerEvents="none"
              >
                {getCanvasPieceLabel(piece, view)}
              </text>
              {isSelected && view === 'front' ? (
                <rect
                  className="resize-handle"
                  x={piece.x + piece.width - 8}
                  y={piece.y + piece.height - 8}
                  width="16"
                  height="16"
                  rx="4"
                  fill="#f8ead6"
                  stroke="#3b2418"
                  strokeWidth="2"
                  onPointerDown={(event) => startResize(event, view, piece)}
                />
              ) : null}
            </g>
          )
        })}
      </svg>
    </div>
  )

  return (
    <section className="content-view builder-view">
      <div className="page-header builder-header">
        <div>
          <p className="section-label">Constructor 2D</p>
          <h2>Crear modelo con tableros de 18 mm</h2>
          <p>Agrega y edita solo en el frente; la vista lateral reacciona con el ancho/fondo.</p>
        </div>
        <div className="builder-header-actions">
          <div className="builder-name-field">
            <label htmlFor="builderModelName">Nombre del modelo</label>
            <input
              id="builderModelName"
              value={modelName}
              onChange={(event) => setModelName(event.target.value)}
            />
          </div>
          <div className="builder-save-actions">
            <button type="button" className="primary-btn" onClick={() => addToProjects(false)}>
              Agregar a Mis proyectos
            </button>
            <button type="button" className="pdf-btn" onClick={() => addToProjects(true)}>
              Agregar a favoritos
            </button>
          </div>
        </div>
      </div>

      <div className="builder-layout">
        <aside className="builder-palette">
          <div>
            <p className="section-label">Nueva pieza</p>
            <h3>Tablero de 18 mm</h3>
          </div>

          <div className="builder-piece-form">
            <label htmlFor="pieceName">Nombre</label>
            <input
              id="pieceName"
              value={newPiece.name}
              onChange={(event) => setNewPiece((piece) => ({ ...piece, name: event.target.value }))}
            />

            <label htmlFor="pieceOrientation">Orientacion</label>
            <select
              id="pieceOrientation"
              value={newPiece.orientation}
              onChange={(event) => setNewPiece((piece) => ({ ...piece, orientation: event.target.value }))}
            >
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>

            <label htmlFor="pieceLength">Largo (mm)</label>
            <input
              id="pieceLength"
              type="number"
              min="40"
              max="600"
              value={newPiece.length}
              onChange={(event) => setNewPiece((piece) => ({ ...piece, length: event.target.value }))}
            />

            <label htmlFor="pieceDepth">Ancho lateral / fondo (mm)</label>
            <input
              id="pieceDepth"
              type="number"
              min="40"
              max="600"
              value={newPiece.depth}
              onChange={(event) => setNewPiece((piece) => ({ ...piece, depth: event.target.value }))}
            />

            <p className="builder-help">
              Espesor fijo: {BOARD_THICKNESS} mm. La vista lateral se genera automaticamente.
            </p>
            <button type="button" className="primary-btn" onClick={addPiece}>
              Agregar pieza
            </button>
          </div>

          <div className="builder-actions">
            <button type="button" className="secondary-btn" onClick={deleteSelectedPiece} disabled={!selectedId}>
              Eliminar pieza
            </button>
            <button type="button" className="secondary-btn" onClick={clearActiveView}>
              Limpiar diseno
            </button>
          </div>
        </aside>

        <div className="builder-workspace">
          <div className="builder-tabs" role="tablist" aria-label="Vistas del constructor">
            <button
              type="button"
              className={activeView === 'front' ? 'active' : ''}
              onClick={() => {
                setActiveView('front')
                setSelectedId(null)
              }}
            >
              Frente
            </button>
            <button
              type="button"
              className={activeView === 'side' ? 'active' : ''}
              onClick={() => {
                setActiveView('side')
                setSelectedId(null)
              }}
            >
              Lado
            </button>
          </div>

          <div className="builder-canvas-grid">
            {renderCanvas('front')}
            {renderCanvas('side')}
          </div>
        </div>

        <aside className="builder-inspector">
          <div>
            <p className="section-label">Inspector</p>
            <h3>{selectedPiece ? selectedPiece.name : 'Sin pieza seleccionada'}</h3>
          </div>

          {selectedPiece ? (
            <div className="builder-piece-form">
              <label htmlFor="selectedName">Nombre</label>
              <input
                id="selectedName"
                value={selectedPiece.name}
                disabled={isSideSelection}
                onChange={(event) => updateSelectedPiece({ name: event.target.value })}
              />

              <label htmlFor="selectedOrientation">Orientacion</label>
              <select
                id="selectedOrientation"
                value={selectedPiece.orientation}
                disabled={isSideSelection}
                onChange={(event) => updateSelectedPiece({ orientation: event.target.value })}
              >
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>

              <label htmlFor="selectedLength">Largo (mm)</label>
              <input
                id="selectedLength"
                type="number"
                min="40"
                max="600"
                value={Math.round(selectedPiece.length)}
                disabled={isSideSelection}
                onChange={(event) => updateSelectedPiece({ length: clamp(Number(event.target.value) || 40, 40, 600) })}
              />

              <label htmlFor="selectedDepth">Ancho lateral / fondo (mm)</label>
              <input
                id="selectedDepth"
                type="number"
                min="40"
                max="600"
                value={Math.round(selectedPiece.depth)}
                disabled={isSideSelection}
                onChange={(event) => updateSelectedPiece({ depth: clamp(Number(event.target.value) || 40, 40, 600) })}
              />

              {isSideSelection ? (
                <p className="builder-help">
                  En la vista de lado puedes acomodar la pieza. Las medidas se cambian desde Frente.
                </p>
              ) : null}

              <div className="builder-measures">
                <span>Espesor: {selectedPiece.thickness} mm</span>
                <span>Ancho lateral: {Math.round(selectedPiece.depth)} mm</span>
                <span>Vista: {ORIENTATION_LABELS[selectedPiece.orientation]}</span>
                <span>X: {Math.round(selectedPiece.x)} mm</span>
                <span>Y: {Math.round(selectedPiece.y)} mm</span>
              </div>
            </div>
          ) : (
            <p className="builder-help">
              Selecciona una pieza para moverla. En Frente tambien puedes cambiar su largo.
            </p>
          )}

          <div className="builder-summary">
            <h4>Resumen del modelo</h4>
            <p>{modelName || 'Mueble nuevo'} - {pieceCount} piezas</p>
            {Object.entries(piecesSummary).length > 0 ? (
              <ul>
                {Object.entries(piecesSummary).map(([label, count]) => (
                  <li key={label}>
                    <span>{label}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="builder-help">Agrega una pieza vertical u horizontal para iniciar.</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
