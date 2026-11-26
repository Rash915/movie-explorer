import { Heart, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { imageUrl } from '../services/tmdbApi'
import { useMovies } from '../context/MovieContext'

export default function MovieCard({ movie, compact = false }) {
  const navigate = useNavigate()
  const { isFavorite, toggleFavorite, user } = useMovies()
  const year = movie.release_date?.slice(0, 4) || 'Coming soon'
  return <motion.article className={`movie-card ${compact ? 'compact' : ''}`} whileHover={{ y: -7 }}
    transition={{ duration: 0.22 }}>
    <button className="poster-button" onClick={() => navigate(`/movie/${movie.id}`)} aria-label={`View ${movie.title}`}>
      {movie.poster_path
        ? <img src={imageUrl(movie.poster_path, 'w500')} alt={movie.title} loading="lazy" />
        : <div className="poster-fallback">{movie.title}</div>}
      <span className="rating-badge"><Star size={12} fill="currentColor"/> {Number(movie.vote_average || 0).toFixed(1)}</span>
      <span className="quick-view">Quick view</span>
    </button>
    <div className="card-info">
      <div><h3>{movie.title}</h3><p>{year}</p></div>
      <button className={`favorite-button ${isFavorite(movie.id) ? 'active' : ''}`}
        onClick={() => user ? toggleFavorite(movie) : navigate(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
        aria-label={user ? 'Toggle favorite' : 'Sign in to save favorite'}><Heart size={18} fill={isFavorite(movie.id) ? 'currentColor' : 'none'} /></button>
    </div>
  </motion.article>
}
