export default function FavoriteStarButton({ isFavorite, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      className={`star-btn ${isFavorite ? 'is-favorite' : ''}`}
      onClick={onClick}
      aria-label={ariaLabel || (isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos')}
      title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
          d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z"
          fill={isFavorite ? '#d4a35a' : 'none'}
          stroke={isFavorite ? '#8b4513' : '#a08568'}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
