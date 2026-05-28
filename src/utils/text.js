export function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function getCategorySlug(categoryName) {
  return normalizeText(categoryName).replace(/\s+/g, '-')
}
