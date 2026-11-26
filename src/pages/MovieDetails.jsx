import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Bookmark, Heart, Play, Star, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { tmdb, imageUrl } from '../services/tmdbApi'
import { useMovies } from '../context/MovieContext'
import MovieCarousel from '../components/MovieCarousel'
import { Loading, ErrorState } from '../components/States'

export default function MovieDetails() {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [similar, setSimilar] = useState([])
  const [recommended, setRecommended] = useState([])
  const [trailer, setTrailer] = useState(null)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isFavorite, isInWatchlist, toggleFavorite, toggleWatchlist, addRecent, user } = useMovies()
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([tmdb.details(id), tmdb.similar(id), tmdb.recommendations(id)])
      .then(([details, sim, rec]) => {
        if (cancelled) return
        setMovie(details); setSimilar(sim.results); setRecommended(rec.results)
        addRecent(details)
        const clip = details.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
          details.videos?.results?.find(v => v.site === 'YouTube')
        setTrailer(clip || null)
      }).catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])
  if (loading) return <main className="details-loading"><div className="skeleton details-hero"/><Loading/></main>
  if (error) return <main><ErrorState message={error} retry={() => window.location.reload()}/></main>
  if (!movie) return null
  const director = movie.credits?.crew?.find(p => p.job === 'Director')
  const formatMoney = n => n ? `$${(n / 1000000).toFixed(1)}M` : 'N/A'
  return <main>
    {trailerOpen && trailer && <TrailerModal clip={trailer} onClose={() => setTrailerOpen(false)}/>}
    <section className="details-hero" style={{ backgroundImage: `url(${imageUrl(movie.backdrop_path, 'original')})` }}>
      <div className="details-overlay"/>
      <div className="details-content">
        <img className="details-poster" src={imageUrl(movie.poster_path, 'w500')} alt={movie.title}/>
        <motion.div className="details-copy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="featured-label"><span/> MOVIE DETAILS</div>
          <h1>{movie.title}</h1>
          {movie.tagline && <p className="tagline">“{movie.tagline}”</p>}
          <div className="hero-meta"><strong><Star size={16} fill="currentColor"/> {Number(movie.vote_average).toFixed(1)}</strong><span>{movie.release_date?.slice(0, 4)}</span><span>{movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'Runtime N/A'}</span></div>
          <div className="genre-pills">{movie.genres?.map(g => <span key={g.id}>{g.name}</span>)}</div>
          <p className="hero-overview">{movie.overview}</p>
          <div className="hero-actions">
            <button className={`primary-button ${isFavorite(movie.id) ? 'active' : ''}`} onClick={() => user ? toggleFavorite(movie) : window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`)}><Heart size={18} fill={isFavorite(movie.id) ? 'currentColor' : 'none'}/>{isFavorite(movie.id) ? 'Favorited' : 'Add to favorites'}</button>
            <button className={`secondary-button ${isInWatchlist(movie.id) ? 'active' : ''}`} onClick={() => user ? toggleWatchlist(movie) : window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`)}><Bookmark size={18} fill={isInWatchlist(movie.id) ? 'currentColor' : 'none'}/>{isInWatchlist(movie.id) ? 'In watchlist' : 'Watchlist'}</button>
            {trailer && <button className="secondary-button" onClick={() => setTrailerOpen(true)}><Play size={18} fill="currentColor"/> Watch trailer</button>}
          </div>
        </motion.div>
      </div>
    </section>
    <div className="details-body">
      <section className="movie-facts"><h2>Overview</h2><div className="facts-grid">
        <div><span>Director</span><strong>{director?.name || 'N/A'}</strong></div><div><span>Release date</span><strong>{movie.release_date || 'N/A'}</strong></div>
        <div><span>Original language</span><strong>{movie.original_language?.toUpperCase()}</strong></div><div><span>Status</span><strong>{movie.status}</strong></div>
        <div><span>Budget</span><strong>{formatMoney(movie.budget)}</strong></div><div><span>Revenue</span><strong>{formatMoney(movie.revenue)}</strong></div>
      </div></section>
      {movie.credits?.cast?.length > 0 && <section className="cast-section"><div className="section-heading"><div><span>THE PEOPLE</span><h2>Cast</h2></div></div><div className="cast-grid">{movie.credits.cast.slice(0, 8).map(person =>
        <div className="cast-card" key={person.id}>{person.profile_path ? <img src={imageUrl(person.profile_path, 'w185')} alt={person.name}/> : <div className="cast-fallback">{person.name[0]}</div>}<strong>{person.name}</strong><span>{person.character}</span></div>)}</div></section>}
      {similar.length > 0 && <MovieCarousel title="Similar movies" eyebrow="YOU MAY ALSO LIKE" movies={similar}/>}
      {recommended.length > 0 && <MovieCarousel title="Recommended" eyebrow="BASED ON THIS MOVIE" movies={recommended}/>}
    </div>
  </main>
}

function TrailerModal({ clip, onClose }) {
  return <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={onClose}>
    <motion.div className="trailer-modal" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} onMouseDown={e => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Close trailer"><X/></button>
      <iframe src={`https://www.youtube.com/embed/${clip.key}?autoplay=1`} title={clip.name} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>
    </motion.div>
  </div>
}
