import { Link } from 'react-router-dom'
export default function NotFound() {
  return <main className="page-shell"><div className="empty-state"><div className="empty-icon">404</div><h3>This scene is missing</h3><p>The page you are looking for does not exist.</p><Link className="primary-button" to="/">Back home</Link></div></main>
}
