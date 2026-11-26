import axios from 'axios'

const apiKey = import.meta.env.VITE_TMDB_API_KEY
const bearer = import.meta.env.VITE_TMDB_BEARER_TOKEN

export const TMDB_READY = Boolean(apiKey || bearer)
export const imageUrl = (path, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null

const api = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  timeout: 12000,
  params: apiKey ? { api_key: apiKey } : {},
  headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
})

const get = async (url, params = {}) => {
  if (!TMDB_READY) throw new Error('TMDB_API_MISSING')
  const { data } = await api.get(url, { params })
  return data
}

export const tmdb = {
  trending: (page = 1) => get('/trending/movie/week', { page }),
  popular: (page = 1) => get('/movie/popular', { page }),
  topRated: (page = 1) => get('/movie/top_rated', { page }),
  upcoming: (page = 1) => get('/movie/upcoming', { page }),
  genres: () => get('/genre/movie/list'),
  search: (query, page = 1) => get('/search/movie', { query, page, include_adult: false }),
  discover: (params = {}) => get('/discover/movie', { include_adult: false, sort_by: 'popularity.desc', ...params }),
  details: (id) => get(`/movie/${id}`, { append_to_response: 'credits,videos,release_dates' }),
  similar: (id) => get(`/movie/${id}/similar`),
  recommendations: (id) => get(`/movie/${id}/recommendations`),
}
