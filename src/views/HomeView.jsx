/**
 * PANTALLA: INICIO (/inicio)
 * Muestra saludo + tarjetas de categorias (Sala, Recamara, etc.)
 * Imagenes: public/images/Categorias_muebles/*.jpeg
 */
import { useNavigate } from 'react-router-dom'
import { FURNITURE_CATEGORIES } from '../data/furnitureCategories.js'
import { getCategorySlug } from '../utils/text.js'

export default function HomeView({ catalogItems, userName }) {
  const navigate = useNavigate()

  return (
    <>
      {/* Texto de bienvenida */}
      <section className="inspiration-hero">
        <div>
          <p className="section-label">Catalogo por espacios</p>
          <h2>Hola {userName || 'usuario'}, manten la inspiracion</h2>
          <p>
            Elige una categoria principal para ver sus subcategorias, modelos disponibles y buscador.
          </p>
        </div>
      </section>

      {/* Tarjetas clicables: cada una abre /categoria/sala, /categoria/recamara, etc. */}
      <section className="category-gallery" aria-label="Categorias principales">
        {FURNITURE_CATEGORIES.map((category) => (
          <button
            type="button"
            className="category-card"
            key={category.name}
            onClick={() => navigate(`/categoria/${getCategorySlug(category.name)}`)}
          >
            {category.image ? (
              <img src={category.image} alt={`Categoria ${category.name}`} />
            ) : (
              <span className="category-placeholder">{category.name}</span>
            )}
            <span className="category-overlay">
              <small>{category.subcategories.length} secciones</small>
              <strong>{category.name}</strong>
            </span>
          </button>
        ))}
        {/* Acceso rapido al constructor 2D (misma ruta que el boton + del menu) */}
        <button
          type="button"
          className="category-card create-category-card"
          onClick={() => navigate('/crear-modelo')}
        >
          <img src="/images/crear_nuev_diseño.jpeg" alt="Crear nuevo diseño de mueble" />
          <span className="category-overlay">
            <small>Constructor 2D</small>
            <strong>Crear mueble</strong>
          </span>
        </button>
      </section>

      {catalogItems.length === 0 ? (
        <section className="content-view inspiration-helper">
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <p>
              No hay muebles en la base de datos. Ejecuta el archivo{' '}
              <strong>backend/seed.sql</strong> en PostgreSQL y reinicia el backend.
            </p>
          </div>
        </section>
      ) : null}
    </>
  )
}
