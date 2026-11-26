import { Bookmark, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { imageUrl } from '../services/tmdbApi'
import { useMovies } from '../context/MovieContext'

export default function HeroSection({ movie, genres = [] }) {
  const navigate = useNavigate()
  const { isInWatchlist, toggleWatchlist, user } = useMovies()
  if (!movie) return null
  const names = genres.filter(g => movie.genre_ids?.includes(g.id)).slice(0, 3)
  return <section className="hero-section" style={{ backgroundImage: `url(${imageUrl(movie.backdrop_path, 'original')})` }}>
    <div className="hero-overlay" />
    <motion.div className="hero-content" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
      <div className="featured-label"><span /> FEATURED THIS WEEK</div>
      <h1>{movie.title}</h1>
      <div className="hero-meta"><strong><Star size={16} fill="currentColor"/> {Number(movie.vote_average).toFixed(1)}</strong><span>{movie.release_date?.slice(0, 4)}</span><span>Movie</span></div>
      <div className="genre-pills">{names.map(g => <span key={g.id}>{g.name}</span>)}</div>
      <p className="hero-overview">{movie.overview}</p>
      <div className="hero-actions">
        <button className="primary-button" onClick={() => navigate(`/movie/${movie.id}`)}>Explore movie</button>
        <button className={`secondary-button ${isInWatchlist(movie.id) ? 'active' : ''}`} onClick={() => user ? toggleWatchlist(movie) : navigate(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`)}><Bookmark size={18} fill={isInWatchlist(movie.id) ? 'currentColor' : 'none'}/>{isInWatchlist(movie.id) ? 'In watchlist' : 'Add to watchlist'}</button>
      </div>
    </motion.div>
  </section>
}
