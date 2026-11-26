import { Link } from 'react-router-dom'
import MovieCard from '../components/MovieCard'
import { EmptyState } from '../components/States'
import { useMovies } from '../context/MovieContext'

export function Favorites() {
  const { favorites } = useMovies()
  return <CollectionPage title="Favorites" eyebrow="YOUR PERSONAL PICKS" movies={favorites} type="favorites"/>
}
export function Watchlist() {
  const { watchlist } = useMovies()
  return <CollectionPage title="My Watchlist" eyebrow="SAVE IT FOR LATER" movies={watchlist} type="watchlist"/>
}
function CollectionPage({ title, eyebrow, movies, type }) {
  const { user } = useMovies()
  return <main className="page-shell"><div className="page-header"><span>{eyebrow}</span><h1>{title}</h1></div>
    {!user ? <EmptyState title="Sign in to see your saved movies" text="Your favorites and watchlist are private to your account." action={<Link className="primary-button" to={`/login?next=${encodeURIComponent(`/${type}`)}`}>Sign in</Link>}/>
      : movies.length ? <div className="movie-grid">{movies.map(movie => <MovieCard key={movie.id} movie={movie}/>)}</div>
      : <EmptyState title={`Your ${type} is empty`} text="Explore movies and save the ones you love." action={<Link className="primary-button" to="/explore">Explore movies</Link>}/>}
  </main>
}
