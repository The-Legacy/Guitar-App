import { useNavigate } from 'react-router-dom'

export default function Metronome() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <h1 className="page-title">Metronome</h1>
      </div>
      <p className="coming-soon">🥁 Metronome coming soon...</p>
    </div>
  )
}
