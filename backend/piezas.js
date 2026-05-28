/**
 * ESCALADO DE PIEZAS AL GUARDAR PROYECTO (backend)
 *
 * Flujo:
 * 1) seed.sql inserta piezas PLANTILLA en piezas_modelo (largo_base, ancho_base por modelo)
 * 2) Usuario guarda proyecto con medidas (ancho, alto, fondo...)
 * 3) index.js llama scalePiezasFromModelo() y guarda resultado en tabla piezas
 *
 * Debe coincidir con build*Pieces() en App.jsx (usado solo para PDF en el navegador).
 */

function positiveDimension(value) {
  return Math.max(1, Math.round(value))
}

function normalizeCubrecanto(value) {
  const numericValue = Number(value)
  if (Number.isFinite(numericValue)) return numericValue > 0 ? 1 : 0
  return String(value || '').trim() ? 1 : 0
}

function normalizeScaledPiezas(piezas) {
  return piezas.map((piece) => ({
    ...piece,
    canto_izq: normalizeCubrecanto(piece.canto_izq),
    canto_der: normalizeCubrecanto(piece.canto_der),
    canto_sup: normalizeCubrecanto(piece.canto_sup),
    canto_inf: normalizeCubrecanto(piece.canto_inf),
  }))
}

/** Entrada: filas de piezas_modelo + medidas del proyecto + base del modelo (JSON en descripcion) */
export function scalePiezasFromModelo(piezasModelo, measures, base) {
  if (base?.tipo === 'buro') {
    return normalizeScaledPiezas(scaleBuroPiezas(piezasModelo, measures))
  }

  if (base?.tipo === 'mueble_tv') {
    return normalizeScaledPiezas(scaleMuebleTvPiezas(piezasModelo, measures))
  }

  if (base?.tipo === 'mesa_centro') {
    return normalizeScaledPiezas(scaleMesaCentroPiezas(piezasModelo, measures))
  }

  if (base?.tipo === 'librero_gavetas') {
    return normalizeScaledPiezas(scaleLibreroGavetasPiezas(piezasModelo, measures))
  }

  if (base?.tipo === 'escritorio1') {
    return normalizeScaledPiezas(scaleEscritorio1Piezas(piezasModelo, measures))
  }

  if (base?.tipo === 'espejo_bano') {
    return normalizeScaledPiezas(scaleEspejoBanoPiezas(piezasModelo, measures))
  }

  if (base?.tipo === 'alacena_cocina') {
    return normalizeScaledPiezas(scaleAlacenaCocinaPiezas(piezasModelo, measures))
  }

  if (base?.tipo === 'estante_sala') {
    return normalizeScaledPiezas(scaleEstanteSalaPiezas(piezasModelo, measures))
  }

  if (base?.tipo === 'closet1') {
    return normalizeScaledPiezas(scaleCloset1Piezas(piezasModelo, measures))
  }

  if (base?.tipo === 'cabecera_cama') {
    return normalizeScaledPiezas(scaleCabeceraCamaPiezas(piezasModelo, measures))
  }

  const { anchoTotal, altoTotal, fondo, anchoSuperior, altoLateral } = measures
  const scaleAncho = anchoTotal / base.anchoTotal
  const scaleAlto = altoTotal / base.altoTotal
  const scaleFondo = fondo / base.fondo
  const scaleAnchoSup = anchoSuperior / base.anchoSuperior
  const scaleAltoLat = altoLateral / base.altoLateral

  return normalizeScaledPiezas(piezasModelo.map((piece) => {
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
  }))
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

function scaleCabeceraCamaPiezas(piezasModelo, measures) {
  const scaleAncho = measures.anchoTotal / 2450
  const scaleAlto = measures.altoTotal / 1150
  const scaleFondo = measures.fondo / 400

  return piezasModelo.map((piece) => {
    let largo = piece.largo_base
    let ancho = piece.ancho_base
    const name = piece.nombre_pieza.toUpperCase()

    if (name === 'RESPALDO VERTICAL') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleAncho)
    } else if (name === 'RESPALDO HORIZONTAL') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'LATERAL DE CAJONERO') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'ZOCALOS' || name === 'AMARRES') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'FRENTE DE CAJON INTERIOR') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'LATERAL DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleFondo)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'FRENTE DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
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

function scaleCloset1Piezas(piezasModelo, measures) {
  const scaleAncho = measures.anchoTotal / 1300
  const scaleAlto = measures.altoTotal / 2100
  const scaleFondo = measures.fondo / 600
  const altoCajonera = measures.altoCajonera ?? 947
  const scaleCajonera = altoCajonera / 947

  return piezasModelo.map((piece) => {
    let largo = piece.largo_base
    let ancho = piece.ancho_base
    const name = piece.nombre_pieza.toUpperCase()

    if (name === 'LATERAL') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'BASE') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'VERTICAL') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'REPISA' || name === 'REPISA 2') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'ZOCALO / AMARRES') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleCajonera)
    } else if (name === 'LATERAL DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleFondo)
      ancho = positiveDimension(piece.ancho_base * scaleCajonera)
    } else if (name === 'FRENTES DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleCajonera)
    } else if (name === 'TAPA DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleFondo)
      ancho = positiveDimension(piece.ancho_base * scaleAncho)
    } else if (name === 'PUERTAS') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleAncho)
    } else if (name === 'FONDO DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleFondo)
      ancho = positiveDimension(piece.ancho_base * scaleAncho)
    } else if (name === 'FONDO DE MUEBLE') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleAncho)
    } else if (name === 'PUERTA CHICA') {
      largo = positiveDimension(measures.altoTotal - altoCajonera)
      ancho = positiveDimension(piece.ancho_base * scaleAncho)
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

function scaleMuebleTvPiezas(piezasModelo, measures) {
  const scaleAncho = measures.anchoTotal / 1300
  const scaleAlto = measures.altoTotal / 1200
  const scaleFondo = measures.fondo / 280

  return piezasModelo.map((piece) => {
    let largo = piece.largo_base
    let ancho = piece.ancho_base
    const name = piece.nombre_pieza.toUpperCase()

    if (name === 'PANEL RESPALDO TV') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'CUBIERTA / REPISA SUPERIOR') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'LATERAL MODULO') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'LATERAL DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleFondo)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'BASE / TAPA DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'DIVISOR CENTRAL') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'REPISA LATERAL') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'SOPORTE VERTICAL TRASERO') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'TAPA PERFIL TRASERO') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'FRENTE DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
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

function scaleMesaCentroPiezas(piezasModelo, measures) {
  const scaleAncho = measures.anchoTotal / 800
  const scaleAlto = measures.altoTotal / 250
  const scaleFondo = measures.fondo / 600

  return piezasModelo.map((piece) => {
    let largo = piece.largo_base
    let ancho = piece.ancho_base
    const name = piece.nombre_pieza.toUpperCase()

    if (name === 'PISO / CUBIERTA') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'SOPORTE LARGO') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'SOPORTE CORTO') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'LATERAL') {
      largo = positiveDimension(piece.largo_base * scaleFondo)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'LATERAL CAJON') {
      largo = positiveDimension(piece.largo_base * scaleFondo)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'TESTERO') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'PISO DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'FRENTE DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'CORREDERA DE EXTENSION') {
      largo = positiveDimension(piece.largo_base * scaleFondo)
      ancho = 0
    } else if (name === 'PATAS') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = 0
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

function scaleLibreroGavetasPiezas(piezasModelo, measures) {
  const scaleAncho = measures.anchoTotal / 650
  const scaleAlto = measures.altoTotal / 2000
  const scaleFondo = measures.fondo / 450
  const scaleCajonera = (measures.altoCajonera ?? 500) / 500

  return piezasModelo.map((piece) => {
    let largo = piece.largo_base
    let ancho = piece.ancho_base
    const name = piece.nombre_pieza.toUpperCase()

    if (name === 'LATERAL') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'BASE / TECHO') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'REPISAS') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'LATERAL DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleFondo)
      ancho = positiveDimension(piece.ancho_base * scaleCajonera)
    } else if (name === 'FRENTE DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleCajonera)
    } else if (name === 'TAPA DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'FONDO DE CAJON') {
      largo = positiveDimension(piece.largo_base * scaleFondo)
      ancho = positiveDimension(piece.ancho_base * scaleAncho)
    } else if (name === 'FONDO DE MUEBLE') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleAncho)
    } else if (name === 'AMARRES') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
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

function scaleEscritorio1Piezas(piezasModelo, measures) {
  const scaleAncho = measures.anchoTotal / 1000
  const scaleAlto = measures.altoTotal / 762
  const scaleFondo = measures.fondo / 470

  return piezasModelo.map((piece) => {
    let largo = piece.largo_base
    let ancho = piece.ancho_base
    const name = piece.nombre_pieza.toUpperCase()

    if (name === 'PATAS') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'REPISAS') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'FALDON') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'ZOCALO') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'AMARRES') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'AMARRES 2') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'TABLERO') {
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

function scaleEspejoBanoPiezas(piezasModelo, measures) {
  const scaleAncho = measures.anchoTotal / 450
  const scaleAlto = measures.altoTotal / 600
  const scaleFondo = measures.fondo / 150

  return piezasModelo.map((piece) => {
    let largo = piece.largo_base
    let ancho = piece.ancho_base
    const name = piece.nombre_pieza.toUpperCase()

    if (name === 'LATERAL') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'BASE Y TECHO') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'REPISAS') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'AMARRE 2') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'PUERTA') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleAncho)
    } else if (name === 'FONDO DE MUEBLES') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleAncho)
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

function scaleAlacenaCocinaPiezas(piezasModelo, measures) {
  const scaleAncho = measures.anchoTotal / 1250
  const scaleAlto = measures.altoTotal / 600
  const scaleFondo = measures.fondo / 300

  return piezasModelo.map((piece) => {
    let largo = piece.largo_base
    let ancho = piece.ancho_base
    const name = piece.nombre_pieza.toUpperCase()

    if (name === 'LATERAL') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'BASE Y TECHO') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'VERTICAL') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'REPISA 1' || name === 'REPISA 2') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'AMARRE') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'FONDO MUEBLE') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
    } else if (name === 'PUERTA') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleAlto)
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

function scaleEstanteSalaPiezas(piezasModelo, measures) {
  const scaleAncho = measures.anchoTotal / 900
  const scaleAlto = measures.altoTotal / 1040
  const scaleFondo = measures.fondo / 280

  return piezasModelo.map((piece) => {
    let largo = piece.largo_base
    let ancho = piece.ancho_base
    const name = piece.nombre_pieza.toUpperCase()

    if (name === 'LATERAL') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'BASE O REPISA') {
      largo = positiveDimension(piece.largo_base * scaleAncho)
      ancho = positiveDimension(piece.ancho_base * scaleFondo)
    } else if (name === 'FONDO') {
      largo = positiveDimension(piece.largo_base * scaleAlto)
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
    anchoModulo: extra.anchoModulo,
    anchoCama: extra.anchoCama,
    fondoSuperior: extra.fondoSuperior,
    anchoFrontal: extra.anchoFrontal,
    anchoPuerta: extra.anchoPuerta,
    altoCajonera: extra.altoCajonera,
    altoPuertaChica: extra.altoPuertaChica,
    altoVertical: extra.altoVertical,
    anchoCajon: extra.anchoCajon,
    fondoModulo: extra.fondoModulo,
    altoDivisor: extra.altoDivisor,
    volado: extra.volado,
    fondoInterior: extra.fondoInterior,
    fondoCajon: extra.fondoCajon,
    anchoFaldon: extra.anchoFaldon,
    fondoTablero: extra.fondoTablero,
    altoZocalo: extra.altoZocalo,
    altoAmarre: extra.altoAmarre,
    altoFondo: extra.altoFondo,
    anchoFondo: extra.anchoFondo,
  }
}
