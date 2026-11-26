import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroSection from '../components/HeroSection'
import MovieCarousel from '../components/MovieCarousel'
import MovieCard from '../components/MovieCard'
import { Loading, ErrorState } from '../components/States'
import { tmdb } from '../services/tmdbApi'

const genreVisual = {
  Action: 'linear-gradient(135deg,#b53f3f,#34131a)',
  Adventure: 'linear-gradient(135deg,#2e7d79,#152d31)',
  Comedy: 'linear-gradient(135deg,#b78238,#382b18)',
  Drama: 'linear-gradient(135deg,#5d4ca1,#211936)',
  Horror: 'linear-gradient(135deg,#4e3137,#170d10)',
  Romance: 'linear-gradient(135deg,#a44a72,#321321)',
  Thriller: 'linear-gradient(135deg,#3f5d82,#111929)',
  'Science Fiction': 'linear-gradient(135deg,#4b55a5,#17182f)',
  Animation: 'linear-gradient(135deg,#8b6d36,#2c2819)',
  Documentary: 'linear-gradient(135deg,#4d7468,#13231d)',
  Fantasy: 'linear-gradient(135deg,#7353a6,#25183a)',
  Mystery: 'linear-gradient(135deg,#6d4a69,#241620)',
}

export default function Home() {
  const [data, setData] = useState({})
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [trending, popular, top, upcoming, genreData] = await Promise.all([
        tmdb.trending(), tmdb.popular(), tmdb.topRated(), tmdb.upcoming(), tmdb.genres(),
      ])
      setData({ trending: trending.results, popular: popular.results, top: top.results, upcoming: upcoming.results })
      setGenres(genreData.genres)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  if (loading) return <main><div className="hero-loading"><div className="skeleton"/></div><Loading cards={10}/></main>
  if (error) return <main><ErrorState message={error} retry={load}/></main>
  return <main>
    <HeroSection movie={data.trending?.[0]} genres={genres}/>
    <div className="home-content">
      <MovieCarousel title="Trending now" eyebrow="WHAT PEOPLE WATCH" movies={data.trending?.slice(0, 14)} />
      <section className="content-section">
        <div className="section-heading"><div><span>CURATED FOR YOU</span><h2>Popular movies</h2></div></div>
        <div className="movie-grid">{data.popular?.slice(0, 10).map(movie => <MovieCard key={movie.id} movie={movie}/>)}</div>
      </section>
      <MovieCarousel title="Top rated" eyebrow="THE ALL-TIME BEST" movies={data.top?.slice(0, 14)} />
      <MovieCarousel title="Coming soon" eyebrow="IN THEATERS & STREAMING" movies={data.upcoming?.slice(0, 14)} />
      <section className="content-section genre-section">
        <div className="section-heading"><div><span>BROWSE BY MOOD</span><h2>Explore genres</h2></div></div>
        <div className="genre-grid">{genres.filter(g => genreVisual[g.name]).map(g =>
          <button className="genre-card" key={g.id} style={{ background: genreVisual[g.name] }}
            onClick={() => navigate(`/explore?genre=${g.id}&name=${encodeURIComponent(g.name)}`)}><span>{g.name}</span></button>)}</div>
      </section>
    </div>
  </main>
}
