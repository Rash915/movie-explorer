import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import MovieCard from './MovieCard'

export default function MovieCarousel({ title, eyebrow, movies = [] }) {
  const ref = useRef(null)
  const move = direction => ref.current?.scrollBy({ left: direction * 660, behavior: 'smooth' })
  return <section className="content-section">
    <div className="section-heading"><div>{eyebrow && <span>{eyebrow}</span>}<h2>{title}</h2></div>
      <div className="carousel-controls"><button onClick={() => move(-1)} aria-label="Previous"><ChevronLeft /></button><button onClick={() => move(1)} aria-label="Next"><ChevronRight /></button></div>
    </div>
    <div className="movie-carousel" ref={ref}>
      {movies.map(movie => <MovieCard key={movie.id} movie={movie} compact />)}
    </div>
  </section>
}
