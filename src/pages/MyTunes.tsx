import { useNavigate } from 'react-router-dom'

export default function MyTunes() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <h1 className="page-title">My Tunes</h1>
      </div>
      <p className="coming-soon">🎵 Your tune log coming soon...</p>
    </div>
  )
}
