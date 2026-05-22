import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import './Dashboard.css'

const sections = [
  {
    id: 'metronome',
    title: 'Metronome',
    description: 'Keep the beat with a configurable tempo and time signature',
    icon: '🥁',
    path: '/metronome',
    accent: 'teal' as const,
  },
  {
    id: 'play-now',
    title: 'Play Now',
    description: 'Play along with tabs synced to a live metronome',
    icon: '🎸',
    path: '/play-now',
    accent: 'orange' as const,
  },
  {
    id: 'chords',
    title: 'Chords',
    description: 'Browse chord diagrams and reference sheets',
    icon: '📖',
    path: '/chords',
    accent: 'teal' as const,
  },
  {
    id: 'my-tunes',
    title: 'My Tunes',
    description: 'Log and revisit your favorite songs and riffs',
    icon: '🎵',
    path: '/my-tunes',
    accent: 'orange' as const,
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  return (
    <div className="dashboard">
      <button className="theme-toggle" onClick={toggle} title="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <header className="dashboard-header">
        <div className="dashboard-logo">🎸</div>
        <h1 className="dashboard-title">GuitarApp</h1>
        <p className="dashboard-subtitle">Your all-in-one guitar companion</p>
        <div className="dashboard-divider" />
      </header>

      <div className="dashboard-grid">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`dashboard-card dashboard-card--${section.accent}`}
            onClick={() => navigate(section.path)}
          >
            <span className="card-icon-wrap">{section.icon}</span>
            <h2 className="card-title">{section.title}</h2>
            <p className="card-description">{section.description}</p>
            <span className="card-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}
