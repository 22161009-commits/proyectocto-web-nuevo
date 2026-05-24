/** Escala piezas del modelo segun medidas del proyecto */

export function scalePiezasFromModelo(piezasModelo, measures, base) {
  const { anchoTotal, altoTotal, fondo, anchoSuperior, altoLateral } = measures
  const scaleAncho = anchoTotal / base.anchoTotal
  const scaleAlto = altoTotal / base.altoTotal
  const scaleFondo = fondo / base.fondo
  const scaleAnchoSup = anchoSuperior / base.anchoSuperior
  const scaleAltoLat = altoLateral / base.altoLateral

  return piezasModelo.map((piece) => {
    let largo = piece.largo_base
    let ancho = piece.ancho_base

    const name = piece.nombre_pieza.toUpperCase()

    if (name === 'COLUMNA' || name === 'VERTICAL') {
      largo = Math.round(piece.largo_base * scaleAlto)
    } else if (name === 'BASE') {
      largo = Math.round(piece.largo_base * scaleAncho)
      ancho = Math.round(piece.ancho_base * scaleFondo)
    } else if (name === 'REPISA') {
      largo = Math.round(piece.largo_base * scaleAncho)
      ancho = Math.round(piece.ancho_base * scaleFondo)
    } else if (name === 'LATERAL') {
      largo = Math.round(piece.largo_base * scaleAltoLat)
      ancho = Math.round(piece.ancho_base * scaleFondo)
    } else if (name === 'BASE Y TECHO') {
      largo = Math.round(piece.largo_base * scaleAnchoSup)
      ancho = Math.round(piece.ancho_base * scaleFondo)
    } else if (name.includes('CAJON')) {
      if (name === 'FONDO DE CAJON') {
        largo = Math.round(piece.largo_base * scaleAnchoSup)
        ancho = Math.round(piece.ancho_base * scaleFondo)
      } else if (name === 'TAPA DE CAJON') {
        largo = Math.round(piece.largo_base * scaleAnchoSup)
        ancho = Math.round(piece.ancho_base * scaleAnchoSup)
      } else if (name === 'FRENTE DE CAJON') {
        largo = Math.round(piece.largo_base * scaleAnchoSup)
      } else {
        largo = Math.round(piece.largo_base * scaleFondo)
      }
    }

    return {
      nombre_pieza: piece.nombre_pieza,
      largo,
      ancho,
      cantidad: piece.cantidad,
      material: piece.material,
      giro: piece.giro,
      canto_izq: piece.canto_izq,
      canto_der: piece.canto_der,
      canto_sup: piece.canto_sup,
      canto_inf: piece.canto_inf,
    }
  })
}

export function buildMeasuresFromProyecto(row) {
  let extra = {}
  if (row.medidas_extra) {
    extra = typeof row.medidas_extra === 'string' ? JSON.parse(row.medidas_extra) : row.medidas_extra
  }
  return {
    anchoTotal: row.ancho,
    altoTotal: row.alto,
    fondo: row.profundidad,
    anchoSuperior: extra.anchoSuperior ?? row.ancho,
    altoLateral: extra.altoLateral ?? 150,
  }
}
