import CatalogGrid from './CatalogGrid.jsx'
import './Dashboard.css'

export default function Dashboard({ onLogout }) {
  return (
    <main className="dashboard">
      <aside className="sidebar">
        <p className="brand">elesquinero</p>
        <p className="menu-title">MENU</p>
        <button type="button" className="menu-item active">
          Principal
        </button>
        <button type="button" className="menu-item child active">
          Inicio
        </button>
        <p className="menu-title">OTHERS</p>
        <button type="button" className="menu-item">
          Authentication
        </button>
      </aside>

      <section className="content">
        <header className="topbar">
          <input className="search" type="text" placeholder="Search or type command..." />
          <button type="button" className="logout" onClick={onLogout}>
            Cerrar sesion
          </button>
        </header>

        <section className="hero-banner">
          <div>
            <p className="section-label">Catalogo principal</p>
            <h2>Selecciona el mueble que quieres construir</h2>
            <p>Catalogo de productos disponibles para seleccion.</p>
          </div>
          <img src="/images/pagiana_de_menu_principal.png" alt="Catalogo de muebles" />
        </section>

        <CatalogGrid />
      </section>
    </main>
  )
}
