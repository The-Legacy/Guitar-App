import { useNavigate } from 'react-router-dom'

export default function PlayNow() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <h1 className="page-title">Play Now</h1>
      </div>
      <p className="coming-soon">🎸 Tab player coming soon...</p>
    </div>
  )
}
