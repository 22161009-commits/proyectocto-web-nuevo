/** Escala piezas del modelo segun medidas del proyecto */

function positiveDimension(value) {
  return Math.max(1, Math.round(value))
}

export function scalePiezasFromModelo(piezasModelo, measures, base) {
  if (base?.tipo === 'buro') {
    return scaleBuroPiezas(piezasModelo, measures)
  }

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
      largo = positiveDimension(piece.largo_base * scaleAlto)
    } else if (name === 'BASE') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'REPISA') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'LATERAL') {
      largo = positiveDimension(piece.largo_base * scaleAltoLat)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'BASE Y TECHO') {
      largo = positiveDimension(piece.largo_base * scaleAnchoSup)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name.includes('CAJON')) {
      if (name === 'FONDO DE CAJON') {
        largo = positiveDimension(piece.largo_base * scaleAnchoSup)
        ancho = positiveDimension(piece.ancho_base * scaleFondo)
      } else if (name === 'TAPA DE CAJON') {
        largo = positiveDimension(piece.largo_base * scaleAnchoSup)
        ancho = positiveDimension(piece.ancho_base * scaleAnchoSup)
      } else if (name === 'FRENTE DE CAJON') {
        largo = positiveDimension(piece.largo_base * scaleAnchoSup)
      } else {
        largo = positiveDimension(piece.largo_base * scaleFondo)
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

function scaleBuroPiezas(piezasModelo, measures) {
  const scaleAncho = measures.anchoTotal / 500
  const scaleAlto = measures.altoTotal / 650
  const scaleFondo = measures.fondo / 550

  return piezasModelo.map((piece) => {
    let largo = piece.largo_base
    let ancho = piece.ancho_base
    const name = piece.nombre_pieza.toUpperCase()

    if (name === 'LATERAL') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'BASE / REPISA') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'TECHO') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'LATERAL DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleFondo)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'FRENTE DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'TAPA DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'FONDO DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
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
    altoCajon: extra.altoCajon ?? 100,
  }
}
