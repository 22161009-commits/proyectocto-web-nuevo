import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { normalizeText } from '../utils/text.js'
import { normalizeCubrecanto, positiveDimension } from '../utils/measures.js'

/* =============================================================================
 * CALCULO DE PIEZAS PARA PDF (solo frontend, catalogo)
 * - Al GUARDAR proyecto: el backend escala con backend/piezas.js -> tabla piezas
 * - Al GENERAR PDF: estas funciones build*Pieces deben dar el mismo resultado
 * Formula tipica: medida_final = medida_base * (medida_usuario / medida_base_modelo)
 * ============================================================================= */

function buildZapateroPieces(measures) {
  const { anchoTotal, altoTotal, fondo, anchoSuperior, altoLateral } = measures

  const columnaLargo = positiveDimension(altoTotal - 168)
  const lateralLargo = positiveDimension(altoLateral - 36)
  const repisaLargo = positiveDimension(260 * (anchoTotal / 480))
  const lateralCajonLargo = positiveDimension(300 * (fondo / 350))
  const frenteCajonLargo = positiveDimension(352 * (anchoSuperior / 450))
  const tapaCajonLargo = positiveDimension(104 * (anchoSuperior / 450))
  const tapaCajonAncho = positiveDimension(404 * (anchoSuperior / 450))
  const fondoCajonLargo = positiveDimension(278 * (anchoSuperior / 450))
  const fondoCajonAncho = positiveDimension(366 * (fondo / 350))

  return [
    { num: 1, nombre: 'COLUMNA', alto: columnaLargo, ancho: 250, cantidad: 1, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 1, cantoSup: 0, cantoInf: 0 },
    { num: 2, nombre: 'VERTICAL', alto: columnaLargo, ancho: 250, cantidad: 1, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 0, cantoSup: 0, cantoInf: 0 },
    { num: 3, nombre: 'BASE', alto: positiveDimension(anchoTotal), ancho: positiveDimension(fondo), cantidad: 1, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 1, cantoSup: 1, cantoInf: 1 },
    { num: 4, nombre: 'REPISA', alto: repisaLargo, ancho: positiveDimension(fondo), cantidad: 12, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 1, cantoSup: 1, cantoInf: 1 },
    { num: 5, nombre: 'LATERAL', alto: lateralLargo, ancho: positiveDimension(fondo), cantidad: 2, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 0, cantoSup: 0, cantoInf: 0 },
    { num: 6, nombre: 'BASE Y TECHO', alto: positiveDimension(anchoSuperior), ancho: positiveDimension(fondo), cantidad: 2, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 1, cantoSup: 1, cantoInf: 1 },
    { num: 7, nombre: 'LATERAL DE CAJON', alto: lateralCajonLargo, ancho: 80, cantidad: 2, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 0, cantoSup: 0, cantoInf: 0 },
    { num: 8, nombre: 'FRENTE DE CAJON', alto: frenteCajonLargo, ancho: 80, cantidad: 2, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 0, cantoSup: 0, cantoInf: 0 },
    { num: 9, nombre: 'TAPA DE CAJON', alto: tapaCajonLargo, ancho: tapaCajonAncho, cantidad: 1, material: 'MDF 15mm', giro: 'N', cantoIzq: 1, cantoDer: 1, cantoSup: 1, cantoInf: 1 },
    { num: 10, nombre: 'FONDO DE CAJON', alto: fondoCajonLargo, ancho: fondoCajonAncho, cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: 0, cantoDer: 0, cantoSup: 0, cantoInf: 0 },
  ]
}

function buildBuroPieces(measures) {
  const { anchoTotal, altoTotal, fondo } = measures
  const scaleAncho = anchoTotal / 500
  const scaleAlto = altoTotal / 650
  const scaleFondo = fondo / 550

  return [
    { num: 1, nombre: 'LATERAL', alto: positiveDimension(532 * scaleAlto), ancho: positiveDimension(400 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 2, nombre: 'BASE / REPISA', alto: positiveDimension(464 * scaleAncho), ancho: positiveDimension(400 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 3, nombre: 'TECHO', alto: positiveDimension(400 * scaleAncho), ancho: positiveDimension(400 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 4, nombre: 'LATERAL DE CAJON', alto: positiveDimension(350 * scaleFondo), ancho: positiveDimension(100 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'FRENTE DE CAJON', alto: positiveDimension(402 * scaleAncho), ancho: positiveDimension(100 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 6, nombre: 'TAPA DE CAJON', alto: positiveDimension(494 * scaleAncho), ancho: positiveDimension(164 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 7, nombre: 'FONDO DE CAJON', alto: positiveDimension(416 * scaleAncho), ancho: positiveDimension(328 * scaleFondo), cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
  ]
}

function buildCabeceraCamaPieces(measures) {
  const { anchoTotal, altoTotal, fondo } = measures
  const scaleAncho = anchoTotal / 2450
  const scaleAlto = altoTotal / 1150
  const scaleFondo = fondo / 400

  return [
    { num: 1, nombre: 'RESPALDO VERTICAL', alto: positiveDimension(1150 * scaleAlto), ancho: positiveDimension(550 * scaleAncho), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'D', cantoInf: 'D' },
    { num: 2, nombre: 'RESPALDO HORIZONTAL', alto: positiveDimension(1550 * scaleAncho), ancho: positiveDimension(400 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'D', cantoInf: 'D' },
    { num: 3, nombre: 'LATERAL DE CAJONERO', alto: positiveDimension(632 * scaleAlto), ancho: positiveDimension(400 * scaleFondo), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 4, nombre: 'ZOCALOS', alto: positiveDimension(414 * scaleAncho), ancho: positiveDimension(80 * scaleAlto), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'AMARRES', alto: positiveDimension(414 * scaleAncho), ancho: positiveDimension(80 * scaleAlto), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 6, nombre: 'FRENTE DE CAJON INTERIOR', alto: positiveDimension(352 * scaleAncho), ancho: positiveDimension(100 * scaleAlto), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 7, nombre: 'LATERAL DE CAJON', alto: positiveDimension(350 * scaleFondo), ancho: positiveDimension(100 * scaleAlto), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 8, nombre: 'FRENTE DE CAJON', alto: positiveDimension(444 * scaleAncho), ancho: positiveDimension(150 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 9, nombre: 'FONDO DE CAJON', alto: positiveDimension(366 * scaleAncho), ancho: positiveDimension(328 * scaleFondo), cantidad: 2, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
  ]
}

function buildCloset1Pieces(measures) {
  const { anchoTotal, altoTotal, fondo, altoCajonera } = measures
  const scaleAncho = anchoTotal / 1300
  const scaleAlto = altoTotal / 2100
  const scaleFondo = fondo / 600
  const scaleCajonera = altoCajonera / 947

  return [
    { num: 1, nombre: 'LATERAL', alto: positiveDimension(2100 * scaleAlto), ancho: positiveDimension(580 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: 'D', cantoInf: '' },
    { num: 2, nombre: 'BASE', alto: positiveDimension(1264 * scaleAncho), ancho: positiveDimension(580 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 3, nombre: 'VERTICAL', alto: positiveDimension(1964 * scaleAlto), ancho: positiveDimension(558 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 4, nombre: 'REPISA', alto: positiveDimension(831 * scaleAncho), ancho: positiveDimension(558 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'REPISA 2', alto: positiveDimension(415 * scaleAncho), ancho: positiveDimension(558 * scaleFondo), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 6, nombre: 'ZOCALO / AMARRES', alto: positiveDimension(1264 * scaleAncho), ancho: positiveDimension(100 * scaleCajonera), cantidad: 5, material: 'Melamina 18mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 7, nombre: 'LATERAL DE CAJON', alto: positiveDimension(500 * scaleFondo), ancho: positiveDimension(173 * scaleCajonera), cantidad: 8, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: 'D', cantoInf: 'D' },
    { num: 8, nombre: 'FRENTES DE CAJON', alto: positiveDimension(353 * scaleAncho), ancho: positiveDimension(173 * scaleCajonera), cantidad: 8, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: 'D', cantoInf: 'D' },
    { num: 9, nombre: 'TAPA DE CAJON', alto: positiveDimension(201 * scaleFondo), ancho: positiveDimension(425 * scaleAncho), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 10, nombre: 'PUERTAS', alto: positiveDimension(1994 * scaleAlto), ancho: positiveDimension(425 * scaleAncho), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 11, nombre: 'FONDO DE CAJON', alto: positiveDimension(478 * scaleFondo), ancho: positiveDimension(367 * scaleAncho), cantidad: 4, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 12, nombre: 'FONDO DE MUEBLE', alto: positiveDimension(1978 * scaleAlto), ancho: positiveDimension(1278 * scaleAncho), cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 13, nombre: 'PUERTA CHICA', alto: positiveDimension(altoTotal - altoCajonera), ancho: positiveDimension(425 * scaleAncho), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
  ]
}

function buildMuebleTvPieces(measures) {
  const { anchoTotal, altoTotal, fondo } = measures
  const scaleAncho = anchoTotal / 1300
  const scaleAlto = altoTotal / 1200
  const scaleFondo = fondo / 280

  return [
    { num: 1, nombre: 'PANEL RESPALDO TV', alto: positiveDimension(1300 * scaleAncho), ancho: positiveDimension(1200 * scaleAlto), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 2, nombre: 'CUBIERTA / REPISA SUPERIOR', alto: positiveDimension(1200 * scaleAncho), ancho: positiveDimension(280 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: 'D', cantoInf: 'D' },
    { num: 3, nombre: 'LATERAL MODULO', alto: positiveDimension(350 * scaleAlto), ancho: positiveDimension(280 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 4, nombre: 'LATERAL DE CAJON', alto: positiveDimension(280 * scaleFondo), ancho: positiveDimension(280 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'BASE / TAPA DE CAJON', alto: positiveDimension(600 * scaleAncho), ancho: positiveDimension(280 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 6, nombre: 'DIVISOR CENTRAL', alto: positiveDimension(150 * scaleAlto), ancho: positiveDimension(280 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 7, nombre: 'REPISA LATERAL', alto: positiveDimension(300 * scaleAncho), ancho: positiveDimension(280 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 8, nombre: 'SOPORTE VERTICAL TRASERO', alto: positiveDimension(1200 * scaleAlto), ancho: positiveDimension(80 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 9, nombre: 'TAPA PERFIL TRASERO', alto: positiveDimension(150 * scaleAlto), ancho: positiveDimension(80 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 10, nombre: 'FRENTE DE CAJON', alto: positiveDimension(600 * scaleAncho), ancho: positiveDimension(280 * scaleAlto), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
  ]
}

function buildMesaCentroPieces(measures) {
  const { anchoTotal, altoTotal, fondo } = measures
  const scaleAncho = anchoTotal / 800
  const scaleAlto = altoTotal / 250
  const scaleFondo = fondo / 600

  return [
    { num: 1, nombre: 'PISO / CUBIERTA', alto: positiveDimension(800 * scaleAncho), ancho: positiveDimension(600 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 2, nombre: 'SOPORTE LARGO', alto: positiveDimension(800 * scaleAncho), ancho: positiveDimension(100 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 3, nombre: 'SOPORTE CORTO', alto: positiveDimension(440 * scaleAncho), ancho: positiveDimension(100 * scaleAlto), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 4, nombre: 'LATERAL', alto: positiveDimension(285 * scaleFondo), ancho: positiveDimension(120 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'LATERAL CAJON', alto: positiveDimension(250 * scaleFondo), ancho: positiveDimension(100 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 6, nombre: 'TESTERO', alto: positiveDimension(544 * scaleAncho), ancho: positiveDimension(100 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 7, nombre: 'PISO DE CAJON', alto: positiveDimension(514 * scaleAncho), ancho: positiveDimension(250 * scaleFondo), cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 8, nombre: 'FRENTE DE CAJON', alto: positiveDimension(600 * scaleAncho), ancho: positiveDimension(120 * scaleAlto), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 9, nombre: 'CORREDERA DE EXTENSION', alto: positiveDimension(250 * scaleFondo), ancho: 0, cantidad: 1, material: 'Herraje', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 10, nombre: 'PATAS', alto: positiveDimension(100 * scaleAlto), ancho: 0, cantidad: 4, material: 'Herraje', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
  ]
}

function buildLibreroGavetasPieces(measures) {
  const { anchoTotal, altoTotal, fondo, altoCajonera } = measures
  const scaleAncho = anchoTotal / 650
  const scaleAlto = altoTotal / 2000
  const scaleFondo = fondo / 450
  const scaleCajonera = (altoCajonera ?? 500) / 500

  return [
    { num: 1, nombre: 'LATERAL', alto: positiveDimension(1964 * scaleAlto), ancho: positiveDimension(450 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 2, nombre: 'BASE / TECHO', alto: positiveDimension(650 * scaleAncho), ancho: positiveDimension(450 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: 'D', cantoInf: 'D' },
    { num: 3, nombre: 'REPISAS', alto: positiveDimension(614 * scaleAncho), ancho: positiveDimension(428 * scaleFondo), cantidad: 3, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 4, nombre: 'LATERAL DE CAJON', alto: positiveDimension(400 * scaleFondo), ancho: positiveDimension(200 * scaleCajonera), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'FRENTE DE CAJON', alto: positiveDimension(552 * scaleAncho), ancho: positiveDimension(200 * scaleCajonera), cantidad: 4, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 6, nombre: 'TAPA DE CAJON', alto: positiveDimension(644 * scaleAncho), ancho: positiveDimension(241 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
    { num: 7, nombre: 'FONDO DE CAJON', alto: positiveDimension(378 * scaleFondo), ancho: positiveDimension(566 * scaleAncho), cantidad: 2, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 8, nombre: 'FONDO DE MUEBLE', alto: positiveDimension(1978 * scaleAlto), ancho: positiveDimension(628 * scaleAncho), cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 9, nombre: 'AMARRES', alto: positiveDimension(614 * scaleAncho), ancho: positiveDimension(100 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
  ]
}

function buildEscritorio1Pieces(measures) {
  const { anchoTotal, altoTotal, fondo } = measures
  const scaleAncho = anchoTotal / 1000
  const scaleAlto = altoTotal / 762
  const scaleFondo = fondo / 470

  return [
    { num: 1, nombre: 'PATAS', alto: positiveDimension(762 * scaleAlto), ancho: positiveDimension(450 * scaleFondo), cantidad: 3, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: 'D', cantoInf: '' },
    { num: 2, nombre: 'REPISAS', alto: positiveDimension(364 * scaleAncho), ancho: positiveDimension(450 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: '', cantoInf: '' },
    { num: 3, nombre: 'FALDON', alto: positiveDimension(582 * scaleAncho), ancho: positiveDimension(400 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 4, nombre: 'ZOCALO', alto: positiveDimension(364 * scaleAncho), ancho: positiveDimension(100 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'AMARRES', alto: positiveDimension(364 * scaleAncho), ancho: positiveDimension(70 * scaleAlto), cantidad: 3, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 6, nombre: 'AMARRES 2', alto: positiveDimension(582 * scaleAncho), ancho: positiveDimension(70 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 7, nombre: 'TABLERO', alto: positiveDimension(1000 * scaleAncho), ancho: positiveDimension(470 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
  ]
}

function buildEspejoBanoPieces(measures) {
  const { anchoTotal, altoTotal, fondo } = measures
  const scaleAncho = anchoTotal / 450
  const scaleAlto = altoTotal / 600
  const scaleFondo = fondo / 150

  return [
    { num: 1, nombre: 'LATERAL', alto: positiveDimension(600 * scaleAlto), ancho: positiveDimension(150 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: 'D', cantoInf: 'D' },
    { num: 2, nombre: 'BASE Y TECHO', alto: positiveDimension(414 * scaleAncho), ancho: positiveDimension(150 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 3, nombre: 'REPISAS', alto: positiveDimension(414 * scaleAncho), ancho: positiveDimension(128 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 4, nombre: 'AMARRE 2', alto: positiveDimension(414 * scaleAncho), ancho: positiveDimension(100 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'PUERTA', alto: positiveDimension(600 * scaleAlto), ancho: positiveDimension(450 * scaleAncho), cantidad: 1, material: 'Melamina 18mm + espejo', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: 'D', cantoInf: 'D' },
    { num: 6, nombre: 'FONDO DE MUEBLES', alto: positiveDimension(578 * scaleAlto), ancho: positiveDimension(428 * scaleAncho), cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
  ]
}

function buildAlacenaCocinaPieces(measures) {
  const { anchoTotal, altoTotal, fondo } = measures
  const scaleAncho = anchoTotal / 1250
  const scaleAlto = altoTotal / 600
  const scaleFondo = fondo / 300

  return [
    { num: 1, nombre: 'LATERAL', alto: positiveDimension(600 * scaleAlto), ancho: positiveDimension(300 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: 'D', cantoInf: 'D' },
    { num: 2, nombre: 'BASE Y TECHO', alto: positiveDimension(1214 * scaleAncho), ancho: positiveDimension(300 * scaleFondo), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 3, nombre: 'VERTICAL', alto: positiveDimension(564 * scaleAlto), ancho: positiveDimension(278 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 4, nombre: 'REPISA 1', alto: positiveDimension(798 * scaleAncho), ancho: positiveDimension(278 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 5, nombre: 'REPISA 2', alto: positiveDimension(398 * scaleAncho), ancho: positiveDimension(278 * scaleFondo), cantidad: 1, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 6, nombre: 'AMARRE', alto: positiveDimension(1214 * scaleAncho), ancho: positiveDimension(100 * scaleAlto), cantidad: 2, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 7, nombre: 'FONDO MUEBLE', alto: positiveDimension(1228 * scaleAncho), ancho: positiveDimension(578 * scaleAlto), cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: '', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 8, nombre: 'PUERTA', alto: positiveDimension(594 * scaleAncho), ancho: positiveDimension(408 * scaleAlto), cantidad: 3, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'G', cantoDer: 'G', cantoSup: 'G', cantoInf: 'G' },
  ]
}

function buildEstanteSalaPieces(measures) {
  const { anchoTotal, altoTotal, fondo } = measures
  const scaleAncho = anchoTotal / 900
  const scaleAlto = altoTotal / 1040
  const scaleFondo = fondo / 280

  return [
    { num: 1, nombre: 'LATERAL', alto: positiveDimension(260 * scaleAlto), ancho: positiveDimension(280 * scaleFondo), cantidad: 5, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: 'D', cantoInf: 'D' },
    { num: 2, nombre: 'BASE O REPISA', alto: positiveDimension(864 * scaleAncho), ancho: positiveDimension(280 * scaleFondo), cantidad: 6, material: 'Melamina 18mm', giro: 'N', cantoIzq: 'D', cantoDer: '', cantoSup: '', cantoInf: '' },
    { num: 3, nombre: 'FONDO', alto: positiveDimension(1400 * scaleAlto), ancho: positiveDimension(300 * scaleFondo), cantidad: 1, material: 'MDF 3mm', giro: 'N', cantoIzq: 'D', cantoDer: 'D', cantoSup: 'D', cantoInf: 'D' },
  ]
}

function buildPiecesForModel(model, measures) {
  if (model?.base?.tipo === 'estante_sala' || normalizeText(model?.title).includes('estante')) {
    return buildEstanteSalaPieces(measures)
  }
  if (model?.base?.tipo === 'alacena_cocina' || normalizeText(model?.title).includes('alacena')) {
    return buildAlacenaCocinaPieces(measures)
  }
  if (model?.base?.tipo === 'espejo_bano' || normalizeText(model?.title).includes('espejo')) {
    return buildEspejoBanoPieces(measures)
  }
  if (model?.base?.tipo === 'escritorio1' || normalizeText(model?.title).includes('escritorio')) {
    return buildEscritorio1Pieces(measures)
  }
  if (model?.base?.tipo === 'librero_gavetas' || normalizeText(model?.title).includes('librero')) {
    return buildLibreroGavetasPieces(measures)
  }
  if (model?.base?.tipo === 'mesa_centro' || normalizeText(model?.title).includes('mesa de centro')) {
    return buildMesaCentroPieces(measures)
  }
  if (model?.base?.tipo === 'mueble_tv' || normalizeText(model?.title).includes('tv')) {
    return buildMuebleTvPieces(measures)
  }
  if (model?.base?.tipo === 'closet1' || normalizeText(model?.title).includes('closet')) {
    return buildCloset1Pieces(measures)
  }
  if (model?.base?.tipo === 'cabecera_cama' || normalizeText(model?.title).includes('cabecera')) {
    return buildCabeceraCamaPieces(measures)
  }
  if (model?.base?.tipo === 'buro' || normalizeText(model?.title).includes('buro')) {
    return buildBuroPieces(measures)
  }
  return buildZapateroPieces(measures)
}

export async function generateCustomModelPdf({ projectName, measures }) {
  const pieces = measures?.pieces || []
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 36

  doc.setFillColor(93, 47, 26)
  doc.rect(0, 0, pageWidth, 56, 'F')
  doc.setTextColor(245, 225, 179)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Despiece de modelo propio', marginX, 36)

  doc.setTextColor(59, 36, 24)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Proyecto: ${projectName || '-'}`, marginX, 78)
  doc.text('Mueble: Modelo personalizado 2D', marginX, 94)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, marginX, 110)

  const groupedPieces = pieces.reduce((summary, piece) => {
    const key = `${piece.name}-${piece.orientation}-${piece.length}-${piece.thickness}-${piece.depth}`
    if (!summary[key]) {
      summary[key] = {
        nombre: piece.name,
        orientacion: piece.orientation === 'vertical' ? 'Vertical' : 'Horizontal',
        largo: piece.length,
        espesor: piece.thickness,
        fondo: piece.depth,
        cantidad: 0,
      }
    }
    summary[key].cantidad += 1
    return summary
  }, {})

  const body = Object.values(groupedPieces).map((piece, index) => [
    index + 1,
    piece.nombre,
    piece.cantidad,
    piece.largo,
    piece.espesor,
    piece.fondo,
    piece.orientacion,
    0,
    0,
    0,
    0,
  ])

  autoTable(doc, {
    head: [
      [
        '#',
        'Pieza',
        'Cant.',
        'Largo (mm)',
        'Espesor (mm)',
        'Fondo (mm)',
        'Orientacion',
        'Canto Izq',
        'Canto Der',
        'Canto Sup',
        'Canto Inf',
      ],
    ],
    body,
    startY: 138,
    theme: 'grid',
    styles: {
      fontSize: 9,
      halign: 'center',
      valign: 'middle',
      lineColor: [201, 176, 139],
      textColor: [59, 36, 24],
    },
    headStyles: {
      fillColor: [139, 69, 19],
      textColor: [248, 238, 221],
      fontStyle: 'bold',
      lineColor: [93, 47, 26],
    },
    alternateRowStyles: { fillColor: [248, 238, 221] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 105, halign: 'left' },
      2: { cellWidth: 32 },
      3: { cellWidth: 55 },
      4: { cellWidth: 58 },
      5: { cellWidth: 55 },
      6: { cellWidth: 62 },
      7: { cellWidth: 40 },
      8: { cellWidth: 40 },
      9: { cellWidth: 40 },
      10: { cellWidth: 40 },
    },
    margin: { left: marginX, right: marginX },
  })

  const finalY = doc.lastAutoTable?.finalY || 170
  doc.setTextColor(93, 47, 26)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Nota', marginX, finalY + 22)
  doc.setTextColor(59, 36, 24)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(
    'Este despiece sale de las piezas creadas en el constructor 2D. Los cantos quedan en 0 porque aun no se editan en modelos propios.',
    marginX,
    finalY + 36,
    { maxWidth: pageWidth - marginX * 2 },
  )

  const safeName = (projectName || 'modelo-propio').replace(/[^a-z0-9\-_ ]/gi, '').trim() || 'modelo-propio'
  doc.save(`${safeName}.pdf`)
}

async function loadImage(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    return await new Promise((resolve) => {
      const img = new Image()
      img.onload = () =>
        resolve({
          dataUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
          format: blob.type === 'image/png' ? 'PNG' : 'JPEG',
        })
      img.onerror = () => resolve(null)
      img.src = dataUrl
    })
  } catch {
    return null
  }
}

export async function generateDespiecePdf({ projectName, model, measures }) {
  const pieces = buildPiecesForModel(model, measures)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 36

  doc.setFillColor(93, 47, 26)
  doc.rect(0, 0, pageWidth, 56, 'F')
  doc.setTextColor(245, 225, 179)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Despiece de mueble', marginX, 36)

  doc.setTextColor(59, 36, 24)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Proyecto: ${projectName || '-'}`, marginX, 78)
  doc.text(`Mueble: ${model?.title || '-'}`, marginX, 94)
  doc.text(
    `Medidas generales: ${measures.anchoTotal} x ${measures.altoTotal} x ${measures.fondo} mm  (ancho x alto x fondo)`,
    marginX,
    110,
  )
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, marginX, 126)

  const imagesTopY = 148
  const imageBlockHeight = 180
  const [muebleImg, diagramImg, supportDiagramImg] = await Promise.all([
    model?.image ? loadImage(model.image) : null,
    model?.diagram ? loadImage(model.diagram) : null,
    model?.supportDiagram ? loadImage(model.supportDiagram) : null,
  ])

  if (muebleImg) {
    const maxW = 170
    const maxH = imageBlockHeight
    const ratio = muebleImg.width / muebleImg.height
    let w = maxW
    let h = w / ratio
    if (h > maxH) {
      h = maxH
      w = h * ratio
    }
    doc.addImage(muebleImg.dataUrl, muebleImg.format, marginX, imagesTopY, w, h)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(122, 98, 72)
    doc.text('Vista del mueble', marginX, imagesTopY + imageBlockHeight + 14)
  }

  if (diagramImg) {
    const maxW = supportDiagramImg ? 190 : 240
    const maxH = imageBlockHeight
    const ratio = diagramImg.width / diagramImg.height
    let w = maxW
    let h = w / ratio
    if (h > maxH) {
      h = maxH
      w = h * ratio
    }
    const xPos = pageWidth - marginX - w
    doc.addImage(diagramImg.dataUrl, diagramImg.format, xPos, imagesTopY, w, h)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(122, 98, 72)
    doc.text('Diagrama del despiece', xPos, imagesTopY + imageBlockHeight + 14)
  }

  if (supportDiagramImg) {
    const maxW = 145
    const maxH = imageBlockHeight
    const ratio = supportDiagramImg.width / supportDiagramImg.height
    let w = maxW
    let h = w / ratio
    if (h > maxH) {
      h = maxH
      w = h * ratio
    }
    const xPos = marginX + 190
    doc.addImage(supportDiagramImg.dataUrl, supportDiagramImg.format, xPos, imagesTopY, w, h)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(122, 98, 72)
    doc.text('Diagrama de apoyo', xPos, imagesTopY + imageBlockHeight + 14)
  }

  const accessoriesY = imagesTopY + imageBlockHeight + 34
  doc.setTextColor(93, 47, 26)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Accesorios basicos:', marginX, accessoriesY)
  doc.setTextColor(59, 36, 24)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(
    'Tornillos 4 x 50, 4 x 40, 3.5 x 17 - 1 par de correderas 30 cm',
    marginX,
    accessoriesY + 16,
  )

  const head = [
    [
      '#',
      'Pieza',
      'Cant.',
      'Alto (mm)',
      'Ancho (mm)',
      'Material',
      'Giro',
      'Canto Izq',
      'Canto Der',
      'Canto Sup',
      'Canto Inf',
    ],
  ]

  const body = pieces.map((piece) => [
    piece.num,
    piece.nombre,
    piece.cantidad,
    piece.alto,
    piece.ancho,
    piece.material,
    piece.giro,
    normalizeCubrecanto(piece.cantoIzq),
    normalizeCubrecanto(piece.cantoDer),
    normalizeCubrecanto(piece.cantoSup),
    normalizeCubrecanto(piece.cantoInf),
  ])

  autoTable(doc, {
    head,
    body,
    startY: accessoriesY + 34,
    theme: 'grid',
    styles: {
      fontSize: 9,
      halign: 'center',
      valign: 'middle',
      lineColor: [201, 176, 139],
      textColor: [59, 36, 24],
    },
    headStyles: {
      fillColor: [139, 69, 19],
      textColor: [248, 238, 221],
      fontStyle: 'bold',
      lineColor: [93, 47, 26],
    },
    alternateRowStyles: { fillColor: [248, 238, 221] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 110, halign: 'left' },
      2: { cellWidth: 32 },
      3: { cellWidth: 55 },
      4: { cellWidth: 55 },
      5: { cellWidth: 60 },
      6: { cellWidth: 30 },
      7: { cellWidth: 40 },
      8: { cellWidth: 40 },
      9: { cellWidth: 40 },
      10: { cellWidth: 40 },
    },
    margin: { left: marginX, right: marginX },
  })

  const finalY = doc.lastAutoTable?.finalY || accessoriesY + 60
  const noteY = finalY + 22
  doc.setTextColor(93, 47, 26)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Cubrecanto', marginX, noteY)
  doc.setTextColor(59, 36, 24)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(
    'Colocar "1" si necesita cubrecanto y "0" si no lo necesita en cada lado de la pieza.',
    marginX,
    noteY + 14,
    { maxWidth: pageWidth - marginX * 2 },
  )
  doc.text(
    'Giro N = sin rotar la pieza (orientacion como en el diagrama).',
    marginX,
    noteY + 30,
    { maxWidth: pageWidth - marginX * 2 },
  )

  const safeName = (projectName || 'despiece').replace(/[^a-z0-9\-_ ]/gi, '').trim() || 'despiece'
  doc.save(`${safeName}.pdf`)
}
