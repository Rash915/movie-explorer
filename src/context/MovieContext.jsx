import { createContext, useContext, useEffect, useState } from 'react'

const MovieContext = createContext(null)
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'Could not complete the request.')
  }
  return response.status === 204 ? null : response.json()
}

export function MovieProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [listError, setListError] = useState('')
  const [favorites, setFavorites] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [recent, setRecent] = useState(() => read('movie-recent', []))
  const [recentSearches, setRecentSearches] = useState(() => read('recent-searches', []))

  useEffect(() => {
    let active = true
    request('/api/auth/me').then(data => {
      if (!active) return
      setUser(data.user)
      setFavorites(data.favorites)
      setWatchlist(data.watchlist)
    }).catch(() => {
      if (active) {
        setUser(null)
        setFavorites([])
        setWatchlist([])
      }
    }).finally(() => { if (active) setAuthLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => localStorage.setItem('movie-recent', JSON.stringify(recent)), [recent])
  useEffect(() => localStorage.setItem('recent-searches', JSON.stringify(recentSearches)), [recentSearches])

  const authenticate = async (mode, credentials) => {
    setAuthError('')
    try {
      const data = await request(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      setUser(data.user)
      setFavorites(data.favorites)
      setWatchlist(data.watchlist)
      setListError('')
      return true
    } catch (error) {
      setAuthError(error.message)
      return false
    }
  }

  const logout = async () => {
    try {
      await request('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setFavorites([])
      setWatchlist([])
      setListError('')
      return true
    } catch (error) {
      setListError(error.message)
      return false
    }
  }

  const toggleList = async (type, movie) => {
    if (!user) return false
    const list = type === 'favorites' ? favorites : watchlist
    const exists = list.some(item => item.id === movie.id)
    const next = exists ? list.filter(item => item.id !== movie.id) : [movie, ...list]
    try {
      const method = exists ? 'DELETE' : 'PUT'
      await request(`/api/lists/${type}/${movie.id}`, {
        method,
        ...(exists ? {} : { body: JSON.stringify({ movie }) }),
      })
      if (type === 'favorites') setFavorites(next)
      else setWatchlist(next)
      setListError('')
      return true
    } catch (error) {
      setListError(error.message)
      return false
    }
  }

  const addRecent = movie => setRecent(items => [movie, ...items.filter(item => item.id !== movie.id)].slice(0, 12))
  const addSearch = query => setRecentSearches(items => [query, ...items.filter(item => item !== query)].slice(0, 8))

  return (
    <MovieContext.Provider value={{
      user, authLoading, authError, listError,
      favorites, watchlist, recent, recentSearches,
      isFavorite: id => favorites.some(movie => movie.id === id),
      isInWatchlist: id => watchlist.some(movie => movie.id === id),
      toggleFavorite: movie => toggleList('favorites', movie),
      toggleWatchlist: movie => toggleList('watchlist', movie),
      authenticate, logout, clearAuthError: () => setAuthError(''),
      clearListError: () => setListError(''),
      addRecent, addSearch,
      clearSearches: () => setRecentSearches([]),
    }}>{children}</MovieContext.Provider>
  )
}

export const useMovies = () => useContext(MovieContext)
