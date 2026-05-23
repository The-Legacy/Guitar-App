import { useNavigate } from 'react-router-dom'

export default function Recordings() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <h1 className="page-title">Recordings</h1>
      </div>
      <p className="coming-soon">Your recorded sessions coming soon...</p>
    </div>
  )
}
