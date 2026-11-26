import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import express from 'express'
import { DatabaseSync } from 'node:sqlite'

const scrypt = promisify(scryptCallback)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDirectory = path.join(root, 'data')
fs.mkdirSync(dataDirectory, { recursive: true })
const db = new DatabaseSync(process.env.MOVIE_DB_PATH || path.join(dataDirectory, 'movie-explorer.sqlite'))
db.exec(fs.readFileSync(path.join(root, 'server', 'schema.sql'), 'utf8'))
db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now())

const app = express()
const port = Number(process.env.PORT) || 3001
const sessionDurationMs = 30 * 24 * 60 * 60 * 1000
const cookieName = 'movie_explorer_session'
const isProduction = process.env.NODE_ENV === 'production'

app.disable('x-powered-by')
app.use(express.json({ limit: '128kb' }))

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

function readCookies(header = '') {
  return Object.fromEntries(header.split(';').map(part => {
    const index = part.indexOf('=')
    if (index < 0) return ['', '']
    const key = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    try { return [key, decodeURIComponent(value)] } catch { return [key, value] }
  }).filter(([key]) => key))
}

function setSessionCookie(res, token) {
  const secure = isProduction ? '; Secure' : ''
  res.setHeader('Set-Cookie', `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionDurationMs / 1000}${secure}`)
}

function clearSessionCookie(res) {
  const secure = isProduction ? '; Secure' : ''
  res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`)
}

function publicUser(user) {
  return { id: user.id, email: user.email, displayName: user.display_name }
}

function requireAuth(req, res, next) {
  const token = readCookies(req.headers.cookie)[cookieName]
  if (!token) return res.status(401).json({ error: 'Sign in to access your account.' })
  const session = db.prepare(`
    SELECT users.id, users.email, users.display_name
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(hashToken(token), Date.now())
  if (!session) {
    clearSessionCookie(res)
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' })
  }
  req.user = session
  req.sessionTokenHash = hashToken(token)
  next()
}

function optionalAuth(req, res, next) {
  const token = readCookies(req.headers.cookie)[cookieName]
  if (!token) {
    req.user = null
    return next()
  }
  const session = db.prepare(`
    SELECT users.id, users.email, users.display_name
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(hashToken(token), Date.now())
  if (!session) clearSessionCookie(res)
  req.user = session || null
  next()
}

function createSession(user, res) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = Date.now() + sessionDurationMs
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(hashToken(token), user.id, expiresAt)
  setSessionCookie(res, token)
  return expiresAt
}

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const body = req.body || {}
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Enter a valid email address.' })
    }
    if (displayName.length < 1 || displayName.length > 60) {
      return res.status(400).json({ error: 'Name must be between 1 and 60 characters.' })
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be between 8 and 128 characters.' })
    }
    const salt = randomBytes(16)
    const passwordHash = await scrypt(password, salt, 64)
    const result = db.prepare(`
      INSERT INTO users (email, display_name, password_hash, password_salt)
      VALUES (?, ?, ?, ?)
    `).run(email, displayName, passwordHash.toString('hex'), salt.toString('hex'))
    const user = { id: Number(result.lastInsertRowid), email, display_name: displayName }
    createSession(user, res)
    return res.status(201).json({ user: publicUser(user), favorites: [], watchlist: [] })
  } catch (error) {
    if (error.code === 'ERR_SQLITE_ERROR' && error.errcode === 2067) {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }
    next(error)
  }
})

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const body = req.body || {}
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const user = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email)
    if (!user || password.length > 128) {
      return res.status(401).json({ error: 'Email or password is incorrect.' })
    }
    const actual = await scrypt(password, Buffer.from(user.password_salt, 'hex'), 64)
    const expected = Buffer.from(user.password_hash, 'hex')
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return res.status(401).json({ error: 'Email or password is incorrect.' })
    }
    createSession(user, res)
    const [favorites, watchlist] = await Promise.all([
      getMovies('favorites', user.id),
      getMovies('watchlist', user.id),
    ])
    return res.json({ user: publicUser(user), favorites, watchlist })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/logout', (req, res) => {
  const token = readCookies(req.headers.cookie)[cookieName]
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token))
  clearSessionCookie(res)
  res.status(204).end()
})

app.get('/api/auth/me', optionalAuth, async (req, res, next) => {
  try {
    if (!req.user) return res.json({ user: null, favorites: [], watchlist: [] })
    const [favorites, watchlist] = await Promise.all([
      getMovies('favorites', req.user.id),
      getMovies('watchlist', req.user.id),
    ])
    res.json({ user: publicUser(req.user), favorites, watchlist })
  } catch (error) {
    next(error)
  }
})

function getMovies(type, userId) {
  const table = type === 'favorites' ? 'favorites' : 'watchlist'
  return db.prepare(`SELECT movie_json FROM ${table} WHERE user_id = ? ORDER BY added_at DESC`)
    .all(userId).map(row => JSON.parse(row.movie_json))
}

app.put('/api/lists/:type/:movieId', requireAuth, (req, res) => {
  const { type } = req.params
  const movieId = Number(req.params.movieId)
  if (!['favorites', 'watchlist'].includes(type)) return res.status(404).json({ error: 'List not found.' })
  if (!Number.isSafeInteger(movieId) || movieId < 1 || req.body?.movie?.id !== movieId ||
      typeof req.body.movie.title !== 'string' || JSON.stringify(req.body.movie).length > 100_000) {
    return res.status(400).json({ error: 'Invalid movie data.' })
  }
  db.prepare(`
    INSERT INTO ${type} (user_id, movie_id, movie_json) VALUES (?, ?, ?)
    ON CONFLICT(user_id, movie_id) DO UPDATE SET movie_json = excluded.movie_json
  `).run(req.user.id, movieId, JSON.stringify(req.body.movie))
  res.status(204).end()
})

app.delete('/api/lists/:type/:movieId', requireAuth, (req, res) => {
  const { type } = req.params
  const movieId = Number(req.params.movieId)
  if (!['favorites', 'watchlist'].includes(type)) return res.status(404).json({ error: 'List not found.' })
  if (!Number.isSafeInteger(movieId) || movieId < 1) return res.status(400).json({ error: 'Invalid movie ID.' })
  db.prepare(`DELETE FROM ${type} WHERE user_id = ? AND movie_id = ?`).run(req.user.id, movieId)
  res.status(204).end()
})

app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }))

const distDirectory = path.join(root, 'dist')
if (fs.existsSync(distDirectory)) {
  app.use(express.static(distDirectory))
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next()
    return res.sendFile(path.join(distDirectory, 'index.html'))
  })
}

app.use((error, req, res, next) => {
  console.error(error)
  if (res.headersSent) return next(error)
  res.status(500).json({ error: 'An unexpected server error occurred.' })
})

app.listen(port, '127.0.0.1', () => {
  console.log(`Movie Explorer API listening on http://127.0.0.1:${port}`)
})
