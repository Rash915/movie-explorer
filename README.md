# Movie Explorer

A premium cinematic movie discovery application built with React, Vite, Tailwind CSS, Framer Motion, and the TMDB API.

## Setup

1. Install Node.js 22.13 or newer (the server uses the built-in `node:sqlite` module).
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add a TMDB API key or bearer token:
   ```env
   VITE_TMDB_API_KEY=your_key
   # or
   VITE_TMDB_BEARER_TOKEN=your_bearer_token
   ```
4. Run `npm run dev`. This starts Vite and the local Express API together.

The API uses Node's built-in SQLite support. It creates `data/movie-explorer.sqlite` and the tables defined in `server/schema.sql` on first run. User passwords are scrypt-hashed and session cookies are HTTP-only. Favorites and watchlists are stored per user. Do not commit `.env` or the database file.

## Commands

- `npm run dev` — start Vite
- `npm run dev:api` — start only the API server
- `npm run dev:web` — start only Vite
- `npm start` — serve the production build and API
- `npm run build` — create a production build
- `npm run preview` — preview the production build

## Features

- Trending, popular, top-rated, and upcoming movies
- Debounced search, suggestions, and local recent searches
- Genre, year, rating, sorting, grid, list, and load-more controls
- Movie details, cast, companies, and financial information
- YouTube trailer modal
- Persistent favorites and watchlist
- Recently viewed profile dashboard
- Responsive navigation and premium loading/error/empty states
