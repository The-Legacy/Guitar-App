import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Square, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react'
import './Metronome.css'

// ── Types ──────────────────────────────────────────────────────────────────
type Subdivision = 4 | 8 | 16
type BeatType = 'accent' | 'beat' | 'and' | 'e' | 'a'
type DotColor = 'teal' | 'orange'
type SideSection = 'subdivision' | 'ands' | 'colors' | null

interface Beat { label: string; type: BeatType }

// ── Beat sequence builders ─────────────────────────────────────────────────
function getBeats(subdivision: Subdivision): Beat[] {
  if (subdivision === 4) return [
    { label: '1', type: 'accent' },
    { label: '2', type: 'beat' },
    { label: '3', type: 'beat' },
    { label: '4', type: 'beat' },
  ]
  if (subdivision === 8) return [
    { label: '1', type: 'accent' }, { label: '+', type: 'and' },
    { label: '2', type: 'beat' },   { label: '+', type: 'and' },
    { label: '3', type: 'beat' },   { label: '+', type: 'and' },
    { label: '4', type: 'beat' },   { label: '+', type: 'and' },
  ]
  return [
    { label: '1', type: 'accent' }, { label: 'e', type: 'e' }, { label: '+', type: 'and' }, { label: 'a', type: 'a' },
    { label: '2', type: 'beat' },   { label: 'e', type: 'e' }, { label: '+', type: 'and' }, { label: 'a', type: 'a' },
    { label: '3', type: 'beat' },   { label: 'e', type: 'e' }, { label: '+', type: 'and' }, { label: 'a', type: 'a' },
    { label: '4', type: 'beat' },   { label: 'e', type: 'e' }, { label: '+', type: 'and' }, { label: 'a', type: 'a' },
  ]
}

function defaultDotColors(sub: Subdivision): DotColor[] {
  return getBeats(sub).map(b =>
    b.type === 'accent' || b.type === 'and' ? 'orange' : 'teal'
  )
}

// How far ahead to schedule audio (seconds) and how often to run the scheduler (ms).
// This decouples audio accuracy from JS timer imprecision.
const LOOKAHEAD_S  = 0.1
const SCHEDULER_MS = 25

// ── Audio synthesis ────────────────────────────────────────────────────────
// Pre-renders a sine-wave click into an AudioBuffer and plays it back.
// AudioBufferSource is more reliable than OscillatorNode in Electron.
function playClick(ctx: AudioContext, type: 'accent' | 'beat' | 'and', startTime: number) {
  const sr   = ctx.sampleRate
  const dur  = 0.08  // 80 ms
  const buf  = ctx.createBuffer(1, Math.ceil(sr * dur), sr)
  const data = buf.getChannelData(0)
  const freq = type === 'accent' ? 1000 : type === 'beat' ? 800 : 600
  const vol  = type === 'accent' ? 0.9  : type === 'beat' ? 0.7  : 0.45
  // Render: sine wave * exponential decay envelope
  for (let i = 0; i < data.length; i++) {
    const t = i / sr
    data[i] = Math.sin(2 * Math.PI * freq * t) * vol * Math.exp(-35 * t)
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.connect(ctx.destination)
  src.start(startTime)
}

const SUBDIVISIONS: { value: Subdivision; label: string; desc: string }[] = [
  { value: 4,  label: '4th',  desc: '1  2  3  4' },
  { value: 8,  label: '8th',  desc: '1+2+3+4+' },
  { value: 16, label: '16th', desc: '1e+a2e+a' },
]

// ── Component ──────────────────────────────────────────────────────────────
export default function Metronome() {
  const navigate = useNavigate()
  const [isPlaying, setIsPlaying]     = useState(false)
  const [bpm, setBpm]                 = useState(100)
  const [subdivision, setSubdivision] = useState<Subdivision>(4)
  const [soundOnAnds, setSoundOnAnds] = useState(false)
  const [currentBeat, setCurrentBeat] = useState(-1)
  const [dotColors, setDotColors]     = useState<DotColor[]>(() => defaultDotColors(4))
  const [openSection, setOpenSection] = useState<SideSection>('subdivision')

  const audioCtxRef  = useRef<AudioContext | null>(null)
  const schedulerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // generation counter — incremented on stop so stale visual setTimeout calls are ignored
  const genRef       = useRef(0)
  // single ref holds all values the scheduler reads, avoiding stale closures
  const schedRef = useRef({
    subdivision: 4 as Subdivision,
    soundOnAnds: false,
    bpm:          100,
    beatIndex:    0,
    nextNoteTime: 0,
  })

  // Keep schedRef in sync with state
  useEffect(() => { schedRef.current.bpm        = bpm        }, [bpm])
  useEffect(() => { schedRef.current.soundOnAnds = soundOnAnds }, [soundOnAnds])
  useEffect(() => {
    schedRef.current.subdivision = subdivision
    schedRef.current.beatIndex   = 0
    if (audioCtxRef.current) schedRef.current.nextNoteTime = audioCtxRef.current.currentTime
    setCurrentBeat(-1)
    setDotColors(defaultDotColors(subdivision))
  }, [subdivision])

  // The scheduler: pre-schedules audio via Web Audio clock, fires visual updates via setTimeout
  const runScheduler = useCallback(() => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    const { subdivision: sub, soundOnAnds: soa, bpm: b } = schedRef.current
    const beats        = getBeats(sub)
    const beatInterval = (60 / b) / (sub / 4)  // seconds per subdivision step
    const gen          = genRef.current

    while (schedRef.current.nextNoteTime < ctx.currentTime + LOOKAHEAD_S) {
      const beatIdx  = schedRef.current.beatIndex
      const beat     = beats[beatIdx]
      const noteTime = schedRef.current.nextNoteTime

      // Schedule audio at the precise Web Audio timestamp
      if (beat.type === 'accent' || beat.type === 'beat') {
        console.log('[scheduler] playing', beat.type, 'at', noteTime.toFixed(3), '(now:', ctx.currentTime.toFixed(3) + ')')
        playClick(ctx, beat.type, noteTime)
      } else if (beat.type === 'and' && soa) {
        playClick(ctx, 'and', noteTime)
      }

      // Schedule the visual dot update aligned to actual speaker output,
      // accounting for hardware output buffer latency (outputLatency)
      const outputLatency = (ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0
      const delay = Math.max(0, (noteTime - ctx.currentTime + outputLatency) * 1000)
      setTimeout(() => { if (genRef.current === gen) setCurrentBeat(beatIdx) }, delay)

      schedRef.current.nextNoteTime += beatInterval
      schedRef.current.beatIndex = (beatIdx + 1) % beats.length
    }
  }, [])

  // Start / stop
  useEffect(() => {
    if (schedulerRef.current) clearInterval(schedulerRef.current)
    if (!isPlaying) {
      genRef.current++          // invalidate any pending visual callbacks
      setCurrentBeat(-1)
      schedRef.current.beatIndex = 0
      return
    }
    const start = async () => {
      // webkitAudioContext fallback for older Chromium builds in Electron
      const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx({ latencyHint: 'interactive' })
      const ctx = audioCtxRef.current
      // Must await resume — context may be suspended by browser autoplay policy
      if (ctx.state !== 'running') await ctx.resume()
      console.log('[Metronome] AudioContext state after resume:', ctx.state)
      schedRef.current.nextNoteTime = ctx.currentTime + 0.05  // small offset so first note isn't in the past
      schedRef.current.beatIndex    = 0
      runScheduler()  // fire immediately so first beat isn't delayed
      schedulerRef.current = setInterval(runScheduler, SCHEDULER_MS)
    }
    start()
    return () => { if (schedulerRef.current) clearInterval(schedulerRef.current) }
  }, [isPlaying, runScheduler])

  useEffect(() => () => {
    if (schedulerRef.current) clearInterval(schedulerRef.current)
    audioCtxRef.current?.close()
  }, [])

  const adjustBpm = (delta: number) => setBpm(b => Math.max(20, Math.min(300, b + delta)))
  const toggleDotColor = (i: number) =>
    setDotColors(prev => { const n = [...prev]; n[i] = n[i] === 'teal' ? 'orange' : 'teal'; return n })
  const toggleSection = (s: SideSection) =>
    setOpenSection(prev => prev === s ? null : s)

  const beats = getBeats(subdivision)

  return (
    <div className="metronome-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <h1 className="page-title">Metronome</h1>
      </div>

      <div className="metronome-body">

        {/* ── Left sidebar ── */}
        <aside className="metro-sidebar">

          {/* Subdivision */}
          <div className="accordion">
            <button
              className={`accordion-hdr${openSection === 'subdivision' ? ' accordion-hdr--open' : ''}`}
              onClick={() => toggleSection('subdivision')}
            >
              <span>Subdivision</span>
              <ChevronRight size={15} className="accordion-chevron" />
            </button>
            {openSection === 'subdivision' && (
              <div className="accordion-body">
                <div className="sub-btns">
                  {SUBDIVISIONS.map(s => (
                    <button
                      key={s.value}
                      className={`sub-btn${subdivision === s.value ? ' sub-btn--active' : ''}`}
                      onClick={() => setSubdivision(s.value)}
                    >
                      <span className="sub-btn-label">{s.label}</span>
                      <span className="sub-btn-desc">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sound on ands (8th / 16th only) */}
          {subdivision >= 8 && (
            <div className="accordion">
              <button
                className={`accordion-hdr${openSection === 'ands' ? ' accordion-hdr--open' : ''}`}
                onClick={() => toggleSection('ands')}
              >
                <span>Sound on ands</span>
                <ChevronRight size={15} className="accordion-chevron" />
              </button>
              {openSection === 'ands' && (
                <div className="accordion-body">
                  <button
                    className={`toggle-pill${soundOnAnds ? ' toggle-pill--on' : ''}`}
                    onClick={() => setSoundOnAnds(v => !v)}
                  >
                    <span className="toggle-pill-thumb" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Dot colors */}
          <div className="accordion">
            <button
              className={`accordion-hdr${openSection === 'colors' ? ' accordion-hdr--open' : ''}`}
              onClick={() => toggleSection('colors')}
            >
              <span>Dot colors</span>
              <ChevronRight size={15} className="accordion-chevron" />
            </button>
            {openSection === 'colors' && (
              <div className="accordion-body">
                <p className="accordion-hint">Click a dot to toggle teal / orange</p>
                <div className="dot-color-grid">
                  {beats.map((beat, i) => (
                    <button key={i} className="dot-color-cell" onClick={() => toggleDotColor(i)}>
                      <div className={`dot-color-preview dot-color-preview--${dotColors[i]}`} />
                      <span className="dot-color-lbl">{beat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </aside>

        {/* ── Main area ── */}
        <main className="metro-main">

          {/* Beat dots — top */}
          <section className="beat-track">
            <div className="beat-dots">
              {beats.map((beat, i) => (
                <div key={i} className="beat-cell">
                  <div
                    className={`beat-dot beat-dot--${dotColors[i]}${i === currentBeat ? ' beat-dot--active' : ''}`}
                    data-type={beat.type}
                  />
                  <span className={`beat-lbl${i === currentBeat ? ' beat-lbl--active' : ''}`}>{beat.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* BPM — below dots */}
          <section className="bpm-section">
            <div className="bpm-stepper">
              <button className="bpm-step-btn" onClick={() => adjustBpm(1)}>
                <ChevronUp size={18} strokeWidth={2.5} />
              </button>
              <div className="bpm-display">
                <span className="bpm-number">{bpm}</span>
                <span className="bpm-unit">BPM</span>
              </div>
              <button className="bpm-step-btn" onClick={() => adjustBpm(-1)}>
                <ChevronDown size={18} strokeWidth={2.5} />
              </button>
            </div>
            <input
              type="range" className="bpm-slider"
              min={20} max={300} value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
            />
            <div className="bpm-range-labels"><span>20</span><span>300</span></div>
          </section>

          {/* Play / Stop */}
          <button
            className={`play-btn${isPlaying ? ' play-btn--stop' : ''}`}
            onClick={() => setIsPlaying(p => !p)}
          >
            {isPlaying
              ? <Square size={30} strokeWidth={0} fill="currentColor" />
              : <Play   size={30} strokeWidth={0} fill="currentColor" style={{ marginLeft: 3 }} />
            }
          </button>

        </main>
      </div>
    </div>
  )
}
