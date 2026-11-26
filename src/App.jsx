import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Explore from './pages/Explore'
import MovieDetails from './pages/MovieDetails'
import { Favorites, Watchlist } from './pages/Collection'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import { useMovies } from './context/MovieContext'

export default function App() {
  const location = useLocation()
  const { listError, clearListError } = useMovies()
  return <div className="app-shell">
    <Navbar/>
    {listError && <div className="app-notice" role="status">{listError}<button onClick={clearListError} aria-label="Dismiss">×</button></div>}
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
        <Routes location={location}>
          <Route path="/" element={<Home/>}/>
          <Route path="/explore" element={<Explore/>}/>
          <Route path="/movie/:id" element={<MovieDetails/>}/>
          <Route path="/favorites" element={<Favorites/>}/>
          <Route path="/watchlist" element={<Watchlist/>}/>
          <Route path="/profile" element={<Profile/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="*" element={<NotFound/>}/>
        </Routes>
      </motion.div>
    </AnimatePresence>
    <Footer/>
  </div>
}
