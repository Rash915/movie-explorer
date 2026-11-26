import { Film } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return <footer className="footer">
    <div className="footer-brand"><Link className="brand" to="/"><span className="brand-mark">M</span><span>MOVIE<span>EXPLORER</span></span></Link>
      <p>Discover the stories everyone is talking about.</p></div>
    <div className="footer-links"><Link to="/">Home</Link><Link to="/explore">Explore</Link><Link to="/favorites">Favorites</Link><Link to="/watchlist">Watchlist</Link></div>
    <div className="footer-meta"><div className="socials"><span>IG</span><span>YT</span><span>IN</span></div>
      <p><Film size={14}/> This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      <p>© {new Date().getFullYear()} Movie Explorer</p></div>
  </footer>
}
