import { CATALOG_ITEMS } from '../data/catalog.js'
import './CatalogGrid.css'

export default function CatalogGrid() {
  return (
    <section className="catalog-grid">
      {CATALOG_ITEMS.map((item) => (
        <article className="card" key={item.title}>
          <img src={item.image} alt={item.title} />
          <span>{item.category}</span>
          <h3>{item.title}</h3>
        </article>
      ))}
    </section>
  )
}
