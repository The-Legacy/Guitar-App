import { useNavigate } from 'react-router-dom'

export default function Tuner() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <h1 className="page-title">Tuner</h1>
      </div>
      <p className="coming-soon">Real-time chromatic tuner coming soon...</p>
    </div>
  )
}
