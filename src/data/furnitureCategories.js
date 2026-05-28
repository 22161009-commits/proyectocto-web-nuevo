import { getCategorySlug, normalizeText } from '../utils/text.js'

export const FURNITURE_CATEGORIES = [
  {
    name: 'Sala',
    image: '/images/Categorias_muebles/CAT_SALA.jpeg',
    subcategories: ['Mesas de centro', 'Muebles TV', 'Estantes'],
    keywords: ['sala', 'tv', 'estante', 'mesa de centro'],
  },
  {
    name: 'Recámara',
    image: '/images/Categorias_muebles/CAT_RECAMARA.jpeg',
    subcategories: ['Zapateros', 'Burós', 'Cabeceras', 'Closets'],
    keywords: ['recamara', 'closet', 'buro', 'cabecera', 'zapatero'],
  },
  {
    name: 'Oficina',
    image: '/images/Categorias_muebles/CAT_OFICINA.jpeg',
    subcategories: ['Escritorios', 'Libreros'],
    keywords: ['oficina', 'escritorio', 'librero'],
  },
  {
    name: 'Cocina',
    image: '/images/Categorias_muebles/CAT_COCINA.jpeg',
    subcategories: ['Alacenas', 'Islas', 'Especieros'],
    keywords: ['cocina', 'alacena', 'isla', 'especiero'],
  },
  {
    name: 'Baño',
    image: '/images/Categorias_muebles/CAT_BANO.jpeg',
    subcategories: ['Espejos'],
    keywords: ['bano', 'espejo'],
  },
]

const CATEGORY_ALIASES = {
  recamara: ['dormitorio', 'organizacion'],
}

const SUBCATEGORY_KEYWORDS = {
  sala: {
    'mesas-de-centro': ['mesa de centro'],
    'muebles-tv': ['tv', 'mueble de tv'],
    estantes: ['estante'],
  },
  cocina: {
    alacenas: ['alacena'],
    islas: ['isla'],
    especieros: ['especiero'],
  },
  recamara: {
    zapateros: ['zapatero'],
    buros: ['buro'],
    cabeceras: ['cabecera'],
    closets: ['closet'],
  },
  oficina: {
    escritorios: ['escritorio'],
    libreros: ['librero'],
  },
  bano: {
    espejos: ['espejo'],
  },
}

export function getItemSearchText(item) {
  return normalizeText(`${item.title} ${item.nombre_modelo} ${item.category}`)
}

export function getModelsForCategory(category, catalogItems) {
  const categorySlug = getCategorySlug(category.name)
  const categoryNames = [category.name, ...(CATEGORY_ALIASES[categorySlug] || [])].map(normalizeText)
  const fallbackWords = category.keywords.map(normalizeText)

  return catalogItems.filter((item) => {
    const itemCategory = normalizeText(item.category)
    if (categoryNames.includes(itemCategory)) return true

    const text = getItemSearchText(item)
    return fallbackWords.some((word) => word && text.includes(word))
  })
}

function getSubcategoryKeywords(category, subcategory) {
  const categorySlug = getCategorySlug(category.name)
  const subcategorySlug = getCategorySlug(subcategory)
  return SUBCATEGORY_KEYWORDS[categorySlug]?.[subcategorySlug] || [subcategory]
}

export function modelMatchesSubcategory(category, subcategory, model) {
  const text = getItemSearchText(model)
  return getSubcategoryKeywords(category, subcategory).some((keyword) =>
    text.includes(normalizeText(keyword)),
  )
}
