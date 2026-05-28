import FavoriteStarButton from '../components/FavoriteStarButton.jsx'

function ProjectRow({ project, onToggleFavorite, onEdit, onDownloadPdf, onDelete }) {
  return (
    <article className="project-row" key={project.id}>
      <img src={project.image} alt={project.name} className="project-thumb" />
      <div>
        <h3>{project.name}</h3>
        <p>
          {project.model} - {project.category}
        </p>
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
  )
}

export default function ProjectsView({
  projectItems,
  userName,
  onToggleFavorite,
  onEdit,
  onDownloadPdf,
  onDelete,
}) {
  const customProjects = projectItems.filter((project) => project.measures?.custom)
  const regularProjects = projectItems.filter((project) => !project.measures?.custom)

  return (
    <section className="content-view">
      <div className="page-header">
        <h2>Mis proyectos</h2>
        <p>Vista de proyectos creados por {userName || 'el usuario actual'}.</p>
      </div>
      {projectItems.length === 0 ? (
        <div className="empty-state">
          <p>No hay proyectos aun. Ve a Inicio y crea uno desde un mueble.</p>
        </div>
      ) : null}

      {customProjects.length > 0 ? (
        <section className="projects-section">
          <div className="projects-section-title">
            <h3>Modelos propios</h3>
            <span>{customProjects.length} modelos</span>
          </div>
          <div className="projects-table">
            {customProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onToggleFavorite={onToggleFavorite}
                onEdit={onEdit}
                onDownloadPdf={onDownloadPdf}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      ) : null}

      {regularProjects.length > 0 ? (
        <section className="projects-section">
          <div className="projects-section-title">
            <h3>Modelos del catalogo</h3>
            <span>{regularProjects.length} proyectos</span>
          </div>
          <div className="projects-table">
            {regularProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onToggleFavorite={onToggleFavorite}
                onEdit={onEdit}
                onDownloadPdf={onDownloadPdf}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  )
}
