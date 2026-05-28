import FavoriteStarButton from '../components/FavoriteStarButton.jsx'

export default function FavoritesView({
  favoriteItems,
  onToggleFavorite,
  onEdit,
  onDownloadPdf,
  onDelete,
}) {
  return (
    <section className="content-view">
      <div className="page-header">
        <h2>Favoritos</h2>
        <p>Proyectos destacados para acceso rapido.</p>
      </div>
      {favoriteItems.length === 0 ? (
        <div className="empty-state">
          <p>Aun no tienes favoritos. Desde Mis proyectos puedes marcarlos con la estrella.</p>
        </div>
      ) : (
        <div className="projects-table">
          {favoriteItems.map((project) => (
            <article className="project-row" key={project.id}>
              <img src={project.image} alt={project.name} className="project-thumb" />
              <div>
                <h3>{project.name}</h3>
                <p>{project.model}</p>
              </div>
              <span>{project.updatedAt}</span>
              <div className="project-actions">
                <FavoriteStarButton
                  isFavorite={!!project.isFavorite}
                  onClick={() => onToggleFavorite(project.id)}
                />
                <button type="button" className="action-btn edit" onClick={() => onEdit(project)}>
                  Editar
                </button>
                <button type="button" className="action-btn pdf" onClick={() => onDownloadPdf(project)}>
                  Descargar PDF
                </button>
                <button
                  type="button"
                  className="action-btn delete"
                  onClick={() => onDelete(project.id)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
