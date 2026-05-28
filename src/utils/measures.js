/**
 * Utilidades de medidas para muebles editables.
 * App.jsx, el editor y el PDF usan estas funciones para mantener una sola logica.
 */

export function positiveDimension(value) {
  return Math.max(1, Math.round(value))
}

export function clampNumber(value, min, max) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return min
  return Math.min(Math.max(numericValue, min), max)
}

export function validateMeasureRange(value, min, max, label) {
  if (value === '' || value === null || value === undefined) {
    return `${label} es obligatorio.`
  }

  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return `${label} debe ser un numero valido.`
  }

  if (numericValue < min || numericValue > max) {
    return `${label} debe estar entre ${min} y ${max} mm.`
  }

  return ''
}

export function normalizeCubrecanto(value) {
  if (typeof value === 'number') return value > 0 ? 1 : 0
  const textValue = String(value || '').trim()
  return textValue && textValue !== '0' ? 1 : 0
}

/**
 * MEDIDAS DERIVADAS
 * El usuario edita medidas principales; aqui calculamos medidas secundarias
 * proporcionales segun el tipo de mueble.
 */
export function getDerivedMeasures(base, measures) {
  if (base.tipo === 'estante_sala') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal
    const scaleFondo = measures.fondo / base.fondo

    return {
      anchoSuperior: Math.round((base.anchoRepisa ?? 864) * scaleAncho),
      altoLateral: Math.round((base.altoLateral ?? 260) * scaleAlto),
      fondoInterior: Math.round((base.fondoInterior ?? 280) * scaleFondo),
      altoFondo: Math.round((base.altoFondo ?? 1400) * scaleAlto),
      anchoFondo: Math.round((base.anchoFondo ?? 300) * scaleFondo),
    }
  }

  if (base.tipo === 'alacena_cocina') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal
    const scaleFondo = measures.fondo / base.fondo

    return {
      anchoSuperior: Math.round((base.anchoInterior ?? 1214) * scaleAncho),
      altoLateral: Math.round((base.altoLateral ?? 600) * scaleAlto),
      anchoModulo: Math.round((base.anchoModuloGrande ?? 798) * scaleAncho),
      anchoPuerta: Math.round((base.anchoPuerta ?? 594) * scaleAncho),
      altoPuertaChica: Math.round((base.altoPuerta ?? 408) * scaleAlto),
      fondoInterior: Math.round((base.fondoInterior ?? 278) * scaleFondo),
      altoFondo: Math.round((base.altoFondo ?? 578) * scaleAlto),
      anchoFondo: Math.round((base.anchoFondo ?? 1228) * scaleAncho),
    }
  }

  if (base.tipo === 'espejo_bano') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal
    const scaleFondo = measures.fondo / base.fondo

    return {
      anchoSuperior: Math.round((base.anchoInterior ?? 414) * scaleAncho),
      altoLateral: Math.round((base.altoLateral ?? 600) * scaleAlto),
      fondoInterior: Math.round((base.fondoInterior ?? 128) * scaleFondo),
      altoFondo: Math.round((base.altoFondo ?? 578) * scaleAlto),
      anchoFondo: Math.round((base.anchoFondo ?? 428) * scaleAncho),
    }
  }

  if (base.tipo === 'escritorio1') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal
    const scaleFondo = measures.fondo / base.fondo

    return {
      anchoSuperior: Math.round((base.anchoRepisa ?? 364) * scaleAncho),
      altoLateral: Math.round((base.altoPatas ?? 762) * scaleAlto),
      anchoFaldon: Math.round((base.anchoFaldon ?? 582) * scaleAncho),
      fondoTablero: Math.round((base.fondoTablero ?? 470) * scaleFondo),
      altoZocalo: Math.round((base.altoZocalo ?? 100) * scaleAlto),
      altoAmarre: Math.round((base.altoAmarre ?? 70) * scaleAlto),
    }
  }

  if (base.tipo === 'librero_gavetas') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal
    const scaleFondo = measures.fondo / base.fondo

    return {
      anchoSuperior: Math.round((base.anchoRepisa ?? 614) * scaleAncho),
      altoLateral: Math.round((base.altoLateral ?? 1964) * scaleAlto),
      altoCajonera: Math.round((base.altoCajonera ?? 500) * scaleAlto),
      altoCajon: Math.round((base.altoCajon ?? 200) * scaleAlto),
      anchoCajon: Math.round((base.anchoCajon ?? 552) * scaleAncho),
      fondoInterior: Math.round((base.fondoInterior ?? 428) * scaleFondo),
      fondoCajon: Math.round((base.fondoCajon ?? 400) * scaleFondo),
    }
  }

  if (base.tipo === 'mesa_centro') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal

    return {
      anchoSuperior: Math.round((base.anchoSoporteIzq ?? 455) * scaleAncho),
      anchoModulo: Math.round((base.anchoSoporteDer ?? 315) * scaleAncho),
      anchoFrontal: Math.round((base.anchoCajon ?? 600) * scaleAncho),
      altoLateral: Math.round((base.altoModulo ?? 150) * scaleAlto),
      altoCajon: Math.round((base.altoPata ?? 100) * scaleAlto),
      volado: Math.round((base.volado ?? 15) * scaleAncho),
    }
  }

  if (base.tipo === 'mueble_tv') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal
    const scaleFondo = measures.fondo / base.fondo

    return {
      anchoSuperior: Math.round((base.anchoCubierta ?? 1200) * scaleAncho),
      altoLateral: Math.round((base.altoModulo ?? 350) * scaleAlto),
      altoCajon: Math.round((base.altoCajon ?? 280) * scaleAlto),
      anchoModulo: Math.round((base.anchoLateral ?? 300) * scaleAncho),
      anchoCajon: Math.round((base.anchoCajon ?? 600) * scaleAncho),
      fondoModulo: Math.round((base.fondoModulo ?? 280) * scaleFondo),
      altoDivisor: Math.round((base.altoDivisor ?? 150) * scaleAlto),
    }
  }

  if (base.tipo === 'closet1') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal
    const altoCajonera = Number(measures.altoCajonera ?? base.altoCajonera ?? 947)

    return {
      anchoSuperior: Math.round((base.anchoInterior ?? 1264) * scaleAncho),
      altoLateral: Math.round((base.altoPuertas ?? 1994) * scaleAlto),
      altoCajon: Math.round((base.altoCajon ?? 173) * (altoCajonera / (base.altoCajonera ?? 947))),
      altoCajonera,
      anchoPuerta: Math.round((base.anchoPuerta ?? 425) * scaleAncho),
      altoPuertaChica: positiveDimension(measures.altoTotal - altoCajonera),
      altoVertical: Math.round((base.altoVertical ?? 1964) * scaleAlto),
      anchoCajon: Math.round((base.anchoCajon ?? 353) * scaleAncho),
    }
  }

  if (base.tipo === 'cabecera_cama') {
    const scaleAncho = measures.anchoTotal / base.anchoTotal
    const scaleAlto = measures.altoTotal / base.altoTotal
    const scaleFondo = measures.fondo / base.fondo

    return {
      anchoSuperior: Math.round((base.anchoRespaldoHorizontal ?? 1550) * scaleAncho),
      altoLateral: Math.round((base.altoCajonero ?? 650) * scaleAlto),
      altoCajon: Math.round((base.altoCajon ?? 150) * scaleAlto),
      anchoModulo: Math.round((base.anchoModulo ?? 550) * scaleAncho),
      anchoCama: Math.round((base.anchoCama ?? 1350) * scaleAncho),
      fondoSuperior: Math.round((base.fondoSuperior ?? 420) * scaleFondo),
      anchoFrontal: Math.round((base.anchoFrontal ?? 450) * scaleAncho),
    }
  }

  return {
    anchoSuperior: Math.round(((base.anchoSuperior ?? base.anchoTotal) / base.anchoTotal) * measures.anchoTotal),
    altoLateral: Math.round(((base.altoLateral ?? 150) / base.altoTotal) * measures.altoTotal),
    altoCajon: Math.round(((base.altoCajon ?? 100) / base.altoTotal) * measures.altoTotal),
  }
}

export function getMeasureRanges(base) {
  const defaultRanges = {
    ancho: {
      min: Math.round(base.anchoTotal * 0.85),
      max: Math.round(base.anchoTotal * 1.15),
    },
    alto: {
      min: Math.round(base.altoTotal * 0.85),
      max: Math.round(base.altoTotal * 1.15),
    },
    fondo: {
      min: Math.round(base.fondo * 0.85),
      max: Math.round(base.fondo * 1.15),
    },
  }

  if (base.tipo === 'buro') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 300), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 420), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 300), max: defaultRanges.fondo.max },
    }
  }

  if (base.tipo === 'cabecera_cama') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 2000), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 900), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 320), max: defaultRanges.fondo.max },
    }
  }

  if (base.tipo === 'closet1') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 900), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 1700), max: defaultRanges.alto.max },
      fondo: { min: base.fondo, max: base.fondo },
      altoCajonera: {
        min: Math.max(Math.round((base.altoCajonera ?? 947) * 0.85), 700),
        max: Math.min(Math.round((base.altoCajonera ?? 947) * 1.15), base.altoTotal - 450),
      },
    }
  }

  if (base.tipo === 'mueble_tv') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 1000), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 900), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 220), max: defaultRanges.fondo.max },
    }
  }

  if (base.tipo === 'mesa_centro') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 600), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 180), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 450), max: defaultRanges.fondo.max },
    }
  }

  if (base.tipo === 'librero_gavetas') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 500), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 1600), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 350), max: defaultRanges.fondo.max },
    }
  }

  if (base.tipo === 'escritorio1') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 800), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 650), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 360), max: defaultRanges.fondo.max },
    }
  }

  if (base.tipo === 'espejo_bano') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 320), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 450), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 100), max: defaultRanges.fondo.max },
    }
  }

  if (base.tipo === 'alacena_cocina') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 950), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 450), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 240), max: defaultRanges.fondo.max },
    }
  }

  if (base.tipo === 'estante_sala') {
    return {
      ancho: { min: Math.max(defaultRanges.ancho.min, 700), max: defaultRanges.ancho.max },
      alto: { min: Math.max(defaultRanges.alto.min, 800), max: defaultRanges.alto.max },
      fondo: { min: Math.max(defaultRanges.fondo.min, 220), max: defaultRanges.fondo.max },
    }
  }

  const minAltoPorPiezas = Math.ceil((36 * base.altoTotal) / (base.altoLateral ?? 150))
  return {
    ancho: { min: Math.max(defaultRanges.ancho.min, 250), max: defaultRanges.ancho.max },
    alto: { min: Math.max(defaultRanges.alto.min, minAltoPorPiezas + 1, 420), max: defaultRanges.alto.max },
    fondo: { min: Math.max(defaultRanges.fondo.min, 220), max: defaultRanges.fondo.max },
  }
}

export function getEditorLabels(model, measures) {
  const base = model?.base || {}
  const derived = getDerivedMeasures(base, measures)
  const allMeasures = { ...measures, ...derived }

  if (base.tipo === 'buro') {
    return [
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '88%', top: '22%' },
      { key: 'altoLateral', value: allMeasures.altoLateral, left: '8%', top: '34%' },
      { key: 'anchoFrontal', value: allMeasures.anchoTotal, left: '31%', top: '49%' },
      { key: 'fondo', value: allMeasures.fondo, left: '88%', top: '72%' },
      { key: 'altoCajon', value: allMeasures.altoCajon, left: '92%', top: '89%' },
      { key: 'anchoPerfil', value: allMeasures.anchoTotal, left: '51%', top: '96%' },
    ]
  }

  if (base.tipo === 'cabecera_cama') {
    return [
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '8%', top: '55%' },
      { key: 'anchoModuloIzq', value: allMeasures.anchoModulo, left: '18%', top: '94%' },
      { key: 'anchoModuloDer', value: allMeasures.anchoModulo, left: '79%', top: '85%' },
      { key: 'anchoCama', value: allMeasures.anchoCama, left: '50%', top: '70%' },
      { key: 'fondo', value: allMeasures.fondo, left: '42%', top: '33%' },
      { key: 'fondoSuperior', value: allMeasures.fondoSuperior, left: '44%', top: '17%' },
      { key: 'altoLateral', value: allMeasures.altoLateral, left: '56%', top: '36%' },
      { key: 'anchoFrontal', value: allMeasures.anchoFrontal, left: '16%', top: '24%' },
      { key: 'anchoRespaldoHorizontal', value: allMeasures.anchoSuperior, left: '49%', top: '57%' },
    ]
  }

  if (base.tipo === 'closet1') {
    return [
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '92%', top: '45%' },
      { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '50%', top: '95%' },
      { key: 'altoCajonera', value: allMeasures.altoCajonera, left: '84%', top: '73%' },
    ]
  }

  if (base.tipo === 'mueble_tv') {
    return [
      { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '36%', top: '5%' },
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '4%', top: '39%', rotated: true },
      { key: 'anchoSuperior', value: allMeasures.anchoSuperior, left: '41%', top: '56%' },
      { key: 'altoLateral', value: allMeasures.altoLateral, left: '88%', top: '61%' },
      { key: 'anchoModuloIzq', value: allMeasures.anchoModulo, left: '20%', top: '83%' },
      { key: 'anchoModuloDer', value: allMeasures.anchoModulo, left: '74%', top: '83%' },
      { key: 'anchoCajon', value: allMeasures.anchoCajon, left: '43%', top: '94%' },
      { key: 'altoCajon', value: allMeasures.altoCajon, left: '50%', top: '74%' },
      { key: 'fondoModulo', value: allMeasures.fondoModulo, left: '92%', top: '91%' },
    ]
  }

  if (base.tipo === 'mesa_centro') {
    return [
      { key: 'fondo', value: allMeasures.fondo, left: '51%', top: '22%' },
      { key: 'anchoSuperior', value: allMeasures.anchoTotal, left: '38%', top: '45%' },
      { key: 'voladoIzq', value: allMeasures.volado, left: '10%', top: '51%' },
      { key: 'anchoSoporteIzq', value: allMeasures.anchoSuperior, left: '28%', top: '51%' },
      { key: 'anchoSoporteDer', value: allMeasures.anchoModulo, left: '60%', top: '51%' },
      { key: 'voladoDer', value: allMeasures.volado, left: '74%', top: '51%' },
      { key: 'altoModulo', value: allMeasures.altoLateral, left: '79%', top: '63%' },
      { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '35%', top: '89%' },
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '88%', top: '72%' },
      { key: 'altoPata', value: allMeasures.altoCajon, left: '88%', top: '82%' },
      { key: 'fondoLateral', value: allMeasures.fondo, left: '74%', top: '89%' },
    ]
  }

  if (base.tipo === 'librero_gavetas') {
    return [
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '12%', top: '48%', rotated: true },
      { key: 'fondo', value: allMeasures.fondo, left: '23%', top: '88%' },
      { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '55%', top: '91%' },
      { key: 'altoCajonera', value: allMeasures.altoCajonera, left: '90%', top: '72%' },
    ]
  }

  if (base.tipo === 'escritorio1') {
    return [
      { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '52%', top: '15%' },
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '90%', top: '58%' },
      { key: 'fondo', value: allMeasures.fondo, left: '24%', top: '82%' },
    ]
  }

  if (base.tipo === 'espejo_bano') {
    return [
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '90%', top: '58%', rotated: true },
      { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '48%', top: '93%' },
      { key: 'fondo', value: allMeasures.fondo, left: '31%', top: '34%', rotated: true },
    ]
  }

  if (base.tipo === 'alacena_cocina') {
    return [
      { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '27%', top: '26%' },
      { key: 'altoTotal', value: allMeasures.altoTotal, left: '37%', top: '32%', rotated: true },
    ]
  }

  if (base.tipo === 'estante_sala') {
    return [
      { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '50%', top: '6%' },
      { key: 'altoLateral1', value: allMeasures.altoLateral, left: '13%', top: '18%' },
      { key: 'altoLateral2', value: allMeasures.altoLateral, left: '86%', top: '33%' },
      { key: 'altoLateral3', value: allMeasures.altoLateral, left: '14%', top: '51%' },
      { key: 'altoLateral4', value: allMeasures.altoLateral, left: '86%', top: '66%' },
      { key: 'altoLateral5', value: allMeasures.altoLateral, left: '14%', top: '83%' },
    ]
  }

  return [
    { key: 'anchoSuperior', value: allMeasures.anchoSuperior, left: '40%', top: '4%' },
    { key: 'altoLateral', value: allMeasures.altoLateral, left: '60%', top: '14%' },
    { key: 'anchoTotal', value: allMeasures.anchoTotal, left: '40%', top: '94%' },
    { key: 'altoTotal', value: allMeasures.altoTotal, left: '6%', top: '50%', rotated: true },
    { key: 'fondo', value: allMeasures.fondo, left: '74%', top: '60%' },
  ]
}
