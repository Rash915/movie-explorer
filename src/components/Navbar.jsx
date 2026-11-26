import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu, Search, UserRound, X } from 'lucide-react'
import { useMovies } from '../context/MovieContext'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user } = useMovies()
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const links = [
    ['Home', '/'], ['Explore', '/explore'], ['Trending', '/explore?sort=trending'],
    ['Top Rated', '/explore?sort=rating'], ['Upcoming', '/explore?sort=upcoming'],
    ['My Watchlist', '/watchlist'],
  ]
  return <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
    <NavLink className="brand" to="/" onClick={() => setOpen(false)}>
      <span className="brand-mark">M</span><span>MOVIE<span>EXPLORER</span></span>
    </NavLink>
    <nav className={open ? 'nav-links open' : 'nav-links'}>
      {links.map(([label, to]) => <NavLink key={to} to={to} onClick={() => setOpen(false)}>{label}</NavLink>)}
    </nav>
    <div className="nav-actions">
      <button className="icon-button" aria-label="Search" onClick={() => navigate('/explore?focus=search')}><Search size={19} /></button>
      <button className="avatar" aria-label={user ? 'Profile' : 'Sign in'} onClick={() => navigate(user ? '/profile' : '/login')}><UserRound size={18} /></button>
      <button className="menu-button" aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </div>
  </header>
}
