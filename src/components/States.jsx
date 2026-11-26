export function Loading({ cards = 8 }) {
  return <div className="movie-grid">{Array.from({ length: cards }).map((_, i) =>
    <div className="skeleton card-skeleton" key={i} />
  )}</div>
}

export function ErrorState({ message, retry }) {
  return <div className="empty-state">
    <div className="empty-icon">!</div>
    <h3>{message === 'TMDB_API_MISSING' ? 'Add your TMDB API key' : 'Could not load movies'}</h3>
    <p>{message === 'TMDB_API_MISSING'
      ? 'Copy .env.example to .env and add VITE_TMDB_API_KEY or VITE_TMDB_BEARER_TOKEN.'
      : 'Check your connection and try again.'}</p>
    {retry && <button className="primary-button" onClick={retry}>Try again</button>}
  </div>
}

export function EmptyState({ title, text, action }) {
  return <div className="empty-state"><div className="empty-icon">0</div><h3>{title}</h3><p>{text}</p>{action}</div>
}
