import { useNavigate } from 'react-router-dom'

export default function Chords() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <h1 className="page-title">Chords</h1>
      </div>
      <p className="coming-soon">📖 Chord library coming soon...</p>
    </div>
  )
}
