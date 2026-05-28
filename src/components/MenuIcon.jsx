export default function MenuIcon({ name }) {
  const icons = {
    inicio: (
      <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />
    ),
    proyectos: (
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5zM8 8h8M8 12h8M8 16h5" />
    ),
    favoritos: (
      <path d="m12 17.3 5.6 3.4-1.5-6.4 5-4.3-6.6-.6L12 3.3 9.5 9.4 3 10l5 4.3-1.5 6.4z" />
    ),
    crear: (
      <path d="M12 5v14M5 12h14" />
    ),
    configuracion: (
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Zm7.2-2.2.1-1.3-.1-1.3 2-1.5-2-3.4-2.4 1a8 8 0 0 0-2.2-1.3L14.2 3h-4.4l-.4 2.5a8 8 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.5-.1 1.3.1 1.3-2 1.5 2 3.4 2.4-1a8 8 0 0 0 2.2 1.3l.4 2.5h4.4l.4-2.5a8 8 0 0 0 2.2-1.3l2.4 1 2-3.4z" />
    ),
    ayuda: (
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-6v.1M9.8 9.2A2.4 2.4 0 0 1 12.1 7c1.4 0 2.4.9 2.4 2.1 0 1.8-2.4 2-2.4 4" />
    ),
  }

  return (
    <svg className="menu-icon" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}
