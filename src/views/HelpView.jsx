export default function HelpView() {
  return (
    <section className="content-view">
      <div className="page-header">
        <h2>Ayuda</h2>
        <p>Guia rapida para usar la app y crear tus proyectos de muebles.</p>
      </div>
      <div className="help-content">
        <article className="help-card">
          <h3>Como usar la app</h3>
          <ul className="help-list">
            <li>En Inicio selecciona una categoria de muebles.</li>
            <li>Elige un modelo del catalogo y ajusta sus medidas en el editor.</li>
            <li>Guarda el mueble en Mis proyectos para seguirlo editando despues.</li>
            <li>Marca proyectos con la estrella para verlos rapido en Favoritos.</li>
            <li>Usa Descargar PDF para obtener el despiece con medidas de corte.</li>
            <li>Con el boton + puedes crear un modelo propio desde el constructor 2D.</li>
          </ul>
        </article>

        <article className="help-card">
          <h3>Soporte</h3>
          <p>
            Si tienes dudas, problemas para iniciar sesion o necesitas ayuda con un proyecto,
            escribe al correo:
          </p>
          <a href="mailto:22161009@itoaxaca.edu.mx">22161009@itoaxaca.edu.mx</a>
        </article>
      </div>
    </section>
  )
}
