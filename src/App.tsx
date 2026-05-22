import { HashRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Dashboard from './pages/Dashboard'
import Metronome from './pages/Metronome'
import Chords from './pages/Chords'
import MyTunes from './pages/MyTunes'
import PlayNow from './pages/PlayNow'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/metronome" element={<Metronome />} />
          <Route path="/chords" element={<Chords />} />
          <Route path="/my-tunes" element={<MyTunes />} />
          <Route path="/play-now" element={<PlayNow />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
