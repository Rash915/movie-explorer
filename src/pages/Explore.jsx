import { useEffect, useRef, useState } from 'react'
import { Grid2X2, List, Search, SlidersHorizontal, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { tmdb } from '../services/tmdbApi'
import MovieCard from '../components/MovieCard'
import { Loading, ErrorState, EmptyState } from '../components/States'
import { useMovies } from '../context/MovieContext'

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const [movies, setMovies] = useState([])
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [layout, setLayout] = useState('grid')
  const [query, setQuery] = useState(params.get('q') || '')
  const [suggestions, setSuggestions] = useState([])
  const { addSearch, recentSearches, clearSearches } = useMovies()
  const searchRef = useRef(null)

  useEffect(() => { tmdb.genres().then(d => setGenres(d.genres)).catch(() => {}) }, [])
  useEffect(() => {
    if (params.get('focus') === 'search') setTimeout(() => searchRef.current?.focus(), 300)
  }, [])

  const load = async (nextPage = 1, append = false) => {
    setLoading(true); setError(null)
    try {
      let data
      const genre = params.get('genre')
      const year = params.get('year')
      const rating = params.get('rating')
      const language = params.get('language')
      const sort = params.get('sort')
      if (query.trim()) data = await tmdb.search(query.trim(), nextPage)
      else if (sort === 'trending') data = await tmdb.trending(nextPage)
      else if (sort === 'rating') data = await tmdb.topRated(nextPage)
      else if (sort === 'upcoming') data = await tmdb.upcoming(nextPage)
      else data = await tmdb.discover({
        page: nextPage,
        with_genres: genre || undefined,
        primary_release_year: year || undefined,
        'vote_average.gte': rating || undefined,
        with_original_language: language || undefined,
        sort_by: sort === 'release' ? 'primary_release_date.desc' : sort === 'rating' ? 'vote_average.desc' : 'popularity.desc',
      })
      setMovies(items => append ? [...items, ...data.results] : data.results)
      setTotal(data.total_results)
      setPage(nextPage)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const id = setTimeout(() => { load(1); if (query.trim()) addSearch(query.trim()) }, 450)
    return () => clearTimeout(id)
  }, [query, params.toString()])

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) { setSuggestions([]); return }
    const id = setTimeout(() => tmdb.search(query, 1).then(d => setSuggestions(d.results.slice(0, 5))).catch(() => {}), 350)
    return () => clearTimeout(id)
  }, [query])

  const update = (key, value) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    setParams(next)
  }
  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i)
  return <main className="page-shell">
    <div className="page-header"><span>DISCOVER</span><h1>Find your next favorite.</h1></div>
    <div className="search-panel">
      <div className="search-box"><Search size={20}/><input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search movies..." />
        {query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={16}/></button>}
        {suggestions.length > 0 && <div className="suggestions">{suggestions.map(movie => <button key={movie.id} onClick={() => { setQuery(movie.title); setSuggestions([]) }}><span>{movie.title}</span><small>{movie.release_date?.slice(0, 4)}</small></button>)}</div>}
      </div>
    </div>
    {recentSearches.length > 0 && <div className="recent-searches"><span>Recent:</span>{recentSearches.map(item => <button key={item} onClick={() => setQuery(item)}>{item}</button>)}<button className="clear-history" onClick={clearSearches}>Clear</button></div>}
    <div className="filter-row">
      <div className="filter-control"><SlidersHorizontal size={16}/><select value={params.get('genre') || ''} onChange={e => update('genre', e.target.value)}><option value="">All genres</option>{genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
      <select value={params.get('year') || ''} onChange={e => update('year', e.target.value)}><option value="">Any year</option>{years.map(year => <option key={year}>{year}</option>)}</select>
      <select value={params.get('rating') || ''} onChange={e => update('rating', e.target.value)}><option value="">Any rating</option><option value="7">7+ rating</option><option value="8">8+ rating</option><option value="9">9+ rating</option></select>
      <select value={params.get('language') || ''} onChange={e => update('language', e.target.value)} aria-label="Filter by language">
        <option value="">All languages</option>
        <option value="en">English</option>
        <option value="hi">Hindi</option>
        <option value="ja">Japanese</option>
        <option value="ko">Korean</option>
        <option value="fr">French</option>
        <option value="es">Spanish</option>
        <option value="de">German</option>
        <option value="it">Italian</option>
        <option value="zh">Chinese</option>
        <option value="ta">Tamil</option>
        <option value="te">Telugu</option>
      </select>
      <select value={params.get('sort') || ''} onChange={e => update('sort', e.target.value)}><option value="">Popular</option><option value="rating">Top rated</option><option value="release">Release date</option><option value="trending">Trending</option><option value="upcoming">Upcoming</option></select>
      <button className="clear-button" onClick={() => setParams({})}>Clear filters</button>
      <div className="layout-toggle"><button className={layout === 'grid' ? 'active' : ''} onClick={() => setLayout('grid')}><Grid2X2 size={16}/></button><button className={layout === 'list' ? 'active' : ''} onClick={() => setLayout('list')}><List size={16}/></button></div>
    </div>
    <div className="results-heading"><p><strong>{total.toLocaleString()}</strong> results</p></div>
    {loading && !movies.length ? <Loading cards={10}/> : error ? <ErrorState message={error} retry={() => load(1)} /> : !movies.length ? <EmptyState title="No movies found" text="Try a broader search or clear some filters."/> :
      <div className={layout === 'grid' ? 'movie-grid' : 'movie-list'}>{movies.map(movie => <MovieCard key={movie.id} movie={movie}/>)}</div>}
    {movies.length < total && <div className="load-more"><button className="secondary-button" disabled={loading} onClick={() => load(page + 1, true)}>{loading ? 'Loading...' : 'Load more'}</button></div>}
  </main>
}
