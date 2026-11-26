import { Heart, Bookmark, Clock3, LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useMovies } from '../context/MovieContext'
import MovieCarousel from '../components/MovieCarousel'

export default function Profile() {
  const { favorites, watchlist, recent, user, logout } = useMovies()
  const navigate = useNavigate()
  if (!user) return <main className="profile-page"><div className="profile-empty"><h2>Make this space yours</h2><p>Sign in to see your personal favorites and watchlist.</p><Link className="primary-button" to="/login?next=%2Fprofile">Sign in</Link></div></main>
  const signOut = async () => {
    if (await logout()) navigate('/', { replace: true })
  }
  return <main className="profile-page">
    <section className="profile-hero"><div className="profile-avatar">{user.displayName.slice(0, 2).toUpperCase()}</div><div><span>YOUR SPACE</span><h1>{user.displayName}'s Profile</h1><p>{user.email}</p></div><button className="secondary-button" onClick={signOut}><LogOut size={17}/> Sign out</button></section>
    <div className="profile-stats"><div><Heart/><strong>{favorites.length}</strong><span>Favorites</span></div><div><Bookmark/><strong>{watchlist.length}</strong><span>Watchlist</span></div><div><Clock3/><strong>{recent.length}</strong><span>Recently viewed</span></div></div>
    {recent.length > 0 ? <MovieCarousel title="Recently viewed" eyebrow="PICK UP WHERE YOU LEFT OFF" movies={recent}/> :
      <div className="profile-empty"><h2>Start your cinematic journey</h2><p>Movies you view will appear here.</p><Link className="primary-button" to="/explore">Discover movies</Link></div>}
  </main>
}
