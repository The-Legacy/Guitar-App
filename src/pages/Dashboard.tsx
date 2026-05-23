import { useNavigate } from 'react-router-dom'
import { Guitar, Metronome, PlayCircle, BookOpen, ListMusic, AudioWaveform, Mic, Sun, Moon, LucideIcon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import './Dashboard.css'

const sections: {
  id: string
  title: string
  description: string
  Icon: LucideIcon
  path: string
  accent: 'teal' | 'orange'
}[] = [
  {
    id: 'metronome',
    title: 'Metronome',
    description: 'Keep the beat with a configurable tempo and time signature',
    Icon: Metronome,
    path: '/metronome',
    accent: 'teal',
  },
  {
    id: 'play-now',
    title: 'Play Now',
    description: 'Play along with tabs synced to a live metronome',
    Icon: PlayCircle,
    path: '/play-now',
    accent: 'orange',
  },
  {
    id: 'chords',
    title: 'Chords',
    description: 'Browse chord diagrams and reference sheets',
    Icon: BookOpen,
    path: '/chords',
    accent: 'teal',
  },
  {
    id: 'my-tunes',
    title: 'My Tunes',
    description: 'Log and revisit your favorite songs and riffs',
    Icon: ListMusic,
    path: '/my-tunes',
    accent: 'orange',
  },
  {
    id: 'tuner',
    title: 'Tuner',
    description: 'Tune your guitar with a real-time chromatic tuner',
    Icon: AudioWaveform,
    path: '/tuner',
    accent: 'teal',
  },
  {
    id: 'recordings',
    title: 'Recordings',
    description: 'Log and listen back to your recorded sessions',
    Icon: Mic,
    path: '/recordings',
    accent: 'orange',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  return (
    <div className="dashboard">
      <button className="theme-toggle" onClick={toggle} title="Toggle theme">
        {theme === 'dark' ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
      </button>
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <Guitar size={52} strokeWidth={1.4} />
        </div>
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
            <span className="card-icon-wrap">
              <section.Icon size={22} strokeWidth={1.75} />
            </span>
            <h2 className="card-title">{section.title}</h2>
            <p className="card-description">{section.description}</p>
            <span className="card-arrow">Open →</span>
          </button>
        ))}
      </div>
    </div>
  )
}
