/**
 * PANTALLA: CATEGORIA (/categoria/:categorySlug)
 * Filtra modelos del catalogo por categoria y subcategoria.
 * Al elegir un mueble llama onChooseModel -> App abre /mueble
 */
import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import {
  FURNITURE_CATEGORIES,
  getItemSearchText,
  getModelsForCategory,
  modelMatchesSubcategory,
} from '../data/furnitureCategories.js'
import { getCategorySlug, normalizeText } from '../utils/text.js'

export default function CategoryView({ catalogItems, onChooseModel }) {
  const { categorySlug } = useParams()
  const [categorySearch, setCategorySearch] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const category = FURNITURE_CATEGORIES.find(
    (item) => getCategorySlug(item.name) === categorySlug,
  )

  if (!category) {
    return <Navigate to="/inicio" replace />
  }

  const categoryModels = getModelsForCategory(category, catalogItems)
  const normalizedSearch = normalizeText(categorySearch)
  const subcategoriesWithModels = category.subcategories.filter((subcategory) =>
    categoryModels.some((model) => modelMatchesSubcategory(category, subcategory, model)),
  )
  const subcategoriesToShow = (subcategoriesWithModels.length > 0
    ? subcategoriesWithModels
    : category.subcategories
  ).filter((subcategory) =>
    normalizeText(`${subcategory} ${category.name}`).includes(normalizedSearch),
  )
  const modelsForSubcategory = selectedSubcategory
    ? categoryModels.filter((model) => modelMatchesSubcategory(category, selectedSubcategory, model))
    : categoryModels
  const visibleModels = modelsForSubcategory.filter((item) =>
    getItemSearchText(item).includes(
      normalizedSearch,
    ),
  )
  const hasSearch = normalizedSearch.length > 0
  const showEmptySearch = hasSearch && subcategoriesToShow.length === 0 && visibleModels.length === 0

  return (
    <>
      <section className="category-detail-hero">
        {category.image ? (
          <img src={category.image} alt={`Categoria ${category.name}`} />
        ) : (
          <span className="category-placeholder">{category.name}</span>
        )}
        <div>
          <p className="section-label">Categoria</p>
          <h2>{category.name}</h2>
          <p>Busca dentro de esta categoria o elige un modelo para crear tu proyecto.</p>
        </div>
      </section>

      <section className="content-view category-section">
        <div className="category-toolbar">
          <input
            className="search category-search"
            type="text"
            value={categorySearch}
            onChange={(event) => setCategorySearch(event.target.value)}
            placeholder={`Buscar en ${category.name}: mueble, subcategoria o modelo...`}
          />
          <button
            type="button"
            className="secondary-link"
            onClick={() => {
              setCategorySearch('')
              setSelectedSubcategory('')
            }}
          >
            Limpiar
          </button>
        </div>

        <div className="category-section-header">
          <div>
            <p className="section-label">Subcategorias</p>
            <h2>{category.name}</h2>
          </div>
          <span>
            {visibleModels.length} modelos disponibles
            {selectedSubcategory ? ` en ${selectedSubcategory}` : ''}
          </span>
        </div>

        <div className="subcategory-grid">
          <button
            type="button"
            className={`subcategory-chip ${selectedSubcategory ? '' : 'active'}`}
            onClick={() => setSelectedSubcategory('')}
          >
            Todos
          </button>
          {(hasSearch
            ? subcategoriesToShow
            : subcategoriesWithModels.length > 0
              ? subcategoriesWithModels
              : category.subcategories
          ).map((subcategory) => (
            <button
              type="button"
              className={`subcategory-chip ${selectedSubcategory === subcategory ? 'active' : ''}`}
              key={subcategory}
              onClick={() => setSelectedSubcategory(subcategory)}
            >
              {subcategory}
            </button>
          ))}
        </div>

        <div className="catalog-grid compact">
          {visibleModels.map((item) => (
            <article className="card" key={item.id_modelo ?? item.title}>
              <img src={item.image} alt={item.title} />
              <span>{item.category}</span>
              <h3>{item.title}</h3>
              <div className="card-actions">
                <button type="button" className="card-btn" onClick={() => onChooseModel(item)}>
                  Elegir mueble
                </button>
              </div>
            </article>
          ))}
        </div>

        {showEmptySearch ? (
          <div className="empty-state soft">
            <p>No encontramos resultados en {category.name} con "{categorySearch}".</p>
          </div>
        ) : null}

        {!hasSearch && categoryModels.length === 0 ? (
          <div className="empty-state soft">
            <p>
              Aun no hay modelos guardados en esta categoria. Puedes agregarlos despues en la base
              de datos.
            </p>
          </div>
        ) : null}
      </section>
    </>
  )
}
