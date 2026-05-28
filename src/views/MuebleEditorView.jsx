import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clampNumber,
  getDerivedMeasures,
  getEditorLabels,
  getMeasureRanges,
  validateMeasureRange,
} from '../utils/measures.js'

/**
 * PANTALLA: EDITOR DE MUEBLE DEL CATALOGO (/mueble)
 * Aqui se editan medidas, se muestran etiquetas sobre el diagrama y se dispara
 * el guardado/PDF. App.jsx solo le pasa el modelo y las funciones principales.
 */
export default function MuebleEditorView({
  model,
  onSave,
  onGeneratePdf,
  isEditing = false,
  initialName = '',
  initialMeasures = null,
  initialFavorite = true,
}) {
  const navigate = useNavigate()

  const safeModelTitle = model?.title ?? 'Mueble'
  const base = model?.base || {
    anchoTotal: 480,
    altoTotal: 1200,
    fondo: 350,
    anchoSuperior: 450,
    altoLateral: 150,
  }
  const isClosetModel = base.tipo === 'closet1'

  const [projectName, setProjectName] = useState(
    () => initialName || `${safeModelTitle} ${new Date().getFullYear()}`,
  )
  const [addToFavorites, setAddToFavorites] = useState(!!initialFavorite)

  const [anchoTotal, setAnchoTotal] = useState(initialMeasures?.anchoTotal ?? base.anchoTotal)
  const [altoTotal, setAltoTotal] = useState(initialMeasures?.altoTotal ?? base.altoTotal)
  const [fondo, setFondo] = useState(initialMeasures?.fondo ?? base.fondo)
  const [altoCajonera, setAltoCajonera] = useState(
    initialMeasures?.altoCajonera ?? base.altoCajonera ?? 947,
  )

  const measureRanges = getMeasureRanges(base)
  const ANCHO_MIN = measureRanges.ancho.min
  const ANCHO_MAX = measureRanges.ancho.max
  const ALTO_MIN = measureRanges.alto.min
  const ALTO_MAX = measureRanges.alto.max
  const FONDO_MIN = measureRanges.fondo.min
  const FONDO_MAX = measureRanges.fondo.max
  const ALTO_CAJONERA_MIN = measureRanges.altoCajonera?.min ?? 0
  const ALTO_CAJONERA_MAX = measureRanges.altoCajonera?.max ?? ALTO_MAX

  const safeMeasures = {
    anchoTotal: clampNumber(anchoTotal, ANCHO_MIN, ANCHO_MAX),
    altoTotal: clampNumber(altoTotal, ALTO_MIN, ALTO_MAX),
    fondo: isClosetModel ? base.fondo : clampNumber(fondo, FONDO_MIN, FONDO_MAX),
    ...(isClosetModel
      ? { altoCajonera: clampNumber(altoCajonera, ALTO_CAJONERA_MIN, ALTO_CAJONERA_MAX) }
      : {}),
  }

  const derivedMeasures = getDerivedMeasures(base, safeMeasures)
  const { anchoSuperior, altoLateral } = derivedMeasures
  const diagramLabels = getEditorLabels(model, safeMeasures)

  const getMeasuresError = () => {
    return (
      validateMeasureRange(anchoTotal, ANCHO_MIN, ANCHO_MAX, 'Ancho total') ||
      validateMeasureRange(altoTotal, ALTO_MIN, ALTO_MAX, 'Altura total') ||
      (isClosetModel
        ? validateMeasureRange(
          altoCajonera,
          ALTO_CAJONERA_MIN,
          Math.min(ALTO_CAJONERA_MAX, safeMeasures.altoTotal - 450),
          'Altura hasta cajones',
        )
        : validateMeasureRange(fondo, FONDO_MIN, FONDO_MAX, 'Fondo'))
    )
  }

  useEffect(() => {
    setProjectName(initialName || `${safeModelTitle} ${new Date().getFullYear()}`)
    setAnchoTotal(initialMeasures?.anchoTotal ?? base.anchoTotal)
    setAltoTotal(initialMeasures?.altoTotal ?? base.altoTotal)
    setFondo(initialMeasures?.fondo ?? base.fondo)
    setAltoCajonera(initialMeasures?.altoCajonera ?? base.altoCajonera ?? 947)
    setAddToFavorites(!!initialFavorite)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeModelTitle, initialName, initialMeasures, initialFavorite])

  const handleSave = (event) => {
    event.preventDefault()
    if (!projectName.trim()) return
    const measuresError = getMeasuresError()
    if (measuresError) {
      window.alert(measuresError)
      return
    }

    onSave({
      name: projectName,
      isFavorite: addToFavorites,
      measures: {
        ...safeMeasures,
        ...derivedMeasures,
      },
    })
  }

  const handleGeneratePdf = async () => {
    const measuresError = getMeasuresError()
    if (measuresError) {
      window.alert(measuresError)
      return
    }

    const measures = {
      ...safeMeasures,
      ...derivedMeasures,
    }
    try {
      await onGeneratePdf?.({ projectName, model, measures })
    } catch {
      window.alert('No se pudo generar el PDF. Intenta de nuevo.')
    }
  }

  if (!model?.diagram) return null

  return (
    <section className="content-view mueble-editor">
      <div className="page-header">
        <h2>
          {isEditing ? 'Editar proyecto' : 'Nuevo proyecto'}: {model.title}
        </h2>
        <p>Modifica las medidas dentro del rango permitido para mantener la proporcion del mueble.</p>
      </div>

      <div className="editor-grid">
        <div className="diagram-stage">
          <div className="diagram-column">
            <div className="diagram-wrapper">
              <img src={model.diagram} alt={`Diagrama de ${model.title}`} className="diagram-img" />

              {diagramLabels.map((label) => (
                <div
                  className={`diagram-label ${label.rotated ? 'diagram-label-rot' : ''}`}
                  style={{ left: label.left, top: label.top }}
                  key={label.key}
                >
                  {label.value}
                </div>
              ))}
            </div>
            {model.supportDiagram ? (
              <div className="support-diagram">
                <p>Diagrama de apoyo</p>
                <img src={model.supportDiagram} alt={`Diagrama de apoyo de ${model.title}`} />
              </div>
            ) : null}
          </div>
        </div>

        <form className="editor-controls" onSubmit={handleSave}>
          <label htmlFor="projectName">Nombre del proyecto</label>
          <input
            id="projectName"
            type="text"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            required
          />

          <label htmlFor="anchoTotal">Ancho total (mm)</label>
          <input
            id="anchoTotal"
            type="number"
            value={anchoTotal}
            min={ANCHO_MIN}
            max={ANCHO_MAX}
            step={1}
            onBlur={(event) => setAnchoTotal(clampNumber(event.target.value, ANCHO_MIN, ANCHO_MAX))}
            onChange={(event) => setAnchoTotal(event.target.value)}
            required
          />
          <div className="editor-hint">
            Rango: {ANCHO_MIN} - {ANCHO_MAX} mm. Medida proporcional: {anchoSuperior} mm
          </div>

          <label htmlFor="altoTotal">Altura total (mm)</label>
          <input
            id="altoTotal"
            type="number"
            value={altoTotal}
            min={ALTO_MIN}
            max={ALTO_MAX}
            step={1}
            onBlur={(event) => setAltoTotal(clampNumber(event.target.value, ALTO_MIN, ALTO_MAX))}
            onChange={(event) => setAltoTotal(event.target.value)}
            required
          />
          <div className="editor-hint">
            Rango: {ALTO_MIN} - {ALTO_MAX} mm. Altura secundaria: {altoLateral} mm
          </div>

          {isClosetModel ? (
            <>
              <label htmlFor="altoCajonera">Alto hasta cajones (mm)</label>
              <input
                id="altoCajonera"
                type="number"
                value={altoCajonera}
                min={ALTO_CAJONERA_MIN}
                max={Math.min(ALTO_CAJONERA_MAX, safeMeasures.altoTotal - 450)}
                step={1}
                onBlur={(event) =>
                  setAltoCajonera(
                    clampNumber(
                      event.target.value,
                      ALTO_CAJONERA_MIN,
                      Math.min(ALTO_CAJONERA_MAX, safeMeasures.altoTotal - 450),
                    ),
                  )}
                onChange={(event) => setAltoCajonera(event.target.value)}
                required
              />
              <div className="editor-hint">
                Rango: {ALTO_CAJONERA_MIN} - {Math.min(ALTO_CAJONERA_MAX, safeMeasures.altoTotal - 450)} mm.
                Fondo fijo: {base.fondo} mm
              </div>
            </>
          ) : (
            <>
              <label htmlFor="fondo">Fondo (mm)</label>
              <input
                id="fondo"
                type="number"
                value={fondo}
                min={FONDO_MIN}
                max={FONDO_MAX}
                step={1}
                onBlur={(event) => setFondo(clampNumber(event.target.value, FONDO_MIN, FONDO_MAX))}
                onChange={(event) => setFondo(event.target.value)}
                required
              />
              <div className="editor-hint">
                Rango: {FONDO_MIN} - {FONDO_MAX} mm
              </div>
            </>
          )}

          <label className="favorite-row">
            <input
              type="checkbox"
              checked={addToFavorites}
              onChange={(event) => setAddToFavorites(event.target.checked)}
            />
            <span>Agregar a favoritos</span>
          </label>

          <div className="editor-actions">
            <button type="submit" className="primary-btn">
              {isEditing ? 'Guardar cambios' : 'Guardar en Mis proyectos'}
            </button>
            <button type="button" className="pdf-btn" onClick={handleGeneratePdf}>
              Generar PDF de despiece
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate(isEditing ? '/mis-proyectos' : '/inicio')}
            >
              Volver
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
