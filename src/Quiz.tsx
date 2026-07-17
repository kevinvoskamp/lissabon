import { useCallback, useEffect, useRef, useState } from 'react'
import { QUIZ_SETS } from './data'
import { supabase } from './lib/supabase'

// Tijdens de reis: de set van de reisdag; daarbuiten: roteert per dag van het jaar
function quizSetIndex(): number {
  const start = new Date(2026, 6, 23)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const dayNum = Math.round((now.getTime() - start.getTime()) / 864e5)
  if (dayNum >= 0 && dayNum < 8) return dayNum
  const doy = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 864e5)
  return doy % QUIZ_SETS.length
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

interface Result {
  person: string
  score: number
  seconds: number
}

type Phase = 'start' | 'playing' | 'done'

// Lokaal dagslot: onthoudt per persoon welke dag ze de quiz afmaakten, zodat je
// ook zonder werkende Supabase maar één keer per dag kunt spelen.
const DONE_KEY = 'lsb-quiz-done'
type DoneMap = Record<string, { day: string; score: number; seconds: number }>
function loadDone(): DoneMap {
  try {
    const s = localStorage.getItem(DONE_KEY)
    if (s) return JSON.parse(s)
  } catch {
    /* ignore */
  }
  return {}
}
function saveDone(person: string, day: string, score: number, seconds: number) {
  try {
    const m = loadDone()
    m[person] = { day, score, seconds }
    localStorage.setItem(DONE_KEY, JSON.stringify(m))
  } catch {
    /* ignore */
  }
}

export default function Quiz({ userName }: { userName: string }) {
  const qSet = QUIZ_SETS[quizSetIndex()]
  const day = todayKey()

  // al gespeeld vandaag (dit apparaat)?
  const doneToday = (() => {
    const d = loadDone()[userName]
    return d && d.day === day ? d : null
  })()

  const [phase, setPhase] = useState<Phase>(doneToday ? 'done' : 'start')
  const [qi, setQi] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [score, setScore] = useState(doneToday ? doneToday.score : 0)
  const [elapsed, setElapsed] = useState(doneToday ? doneToday.seconds : 0)
  const [results, setResults] = useState<Result[]>([])
  const startedAt = useRef(0)
  const ticker = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const loadResults = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('lsb_quiz_results').select('person,score,seconds').eq('quiz_day', day)
    if (!data) return
    setResults(data as Result[])
    // al gespeeld vandaag op een ander apparaat? dan hier ook de uitslag tonen + dagslot zetten
    const mineRow = (data as Result[]).find((r) => r.person === userName)
    if (mineRow) {
      setPhase('done')
      setScore(mineRow.score)
      setElapsed(mineRow.seconds)
      saveDone(userName, day, mineRow.score, mineRow.seconds)
    }
  }, [day, userName])

  useEffect(() => {
    loadResults()
    return () => clearInterval(ticker.current)
  }, [loadResults])

  // timer
  useEffect(() => {
    if (phase !== 'playing') return
    ticker.current = setInterval(() => setElapsed(Math.round((Date.now() - startedAt.current) / 1000)), 1000)
    return () => clearInterval(ticker.current)
  }, [phase])

  function start() {
    startedAt.current = Date.now()
    setElapsed(0)
    setQi(0)
    setChosen(null)
    setScore(0)
    setPhase('playing')
  }

  function answer(idx: number) {
    if (chosen != null) return
    setChosen(idx)
    if (idx === qSet[qi].c) setScore((s) => s + 1)
  }

  async function next(finalScore: number) {
    if (qi + 1 < qSet.length) {
      setQi(qi + 1)
      setChosen(null)
      return
    }
    // klaar: tijd vastzetten en opslaan
    const secs = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000))
    clearInterval(ticker.current)
    setElapsed(secs)
    setPhase('done')
    saveDone(userName, day, finalScore, secs)
    setResults((prev) => [...prev.filter((r) => r.person !== userName), { person: userName, score: finalScore, seconds: secs }])
    if (supabase) {
      const { error } = await supabase
        .from('lsb_quiz_results')
        .upsert({ person: userName, quiz_day: day, score: finalScore, seconds: secs }, { onConflict: 'person,quiz_day' })
      if (error) console.warn('Quiz-uitslag niet opgeslagen:', error.message)
      else loadResults()
    }
  }

  // winnaar: hoogste score, dan snelste tijd
  const ranked = [...results].sort((a, b) => b.score - a.score || a.seconds - b.seconds)

  return (
    <div>
      <div style={{ padding: '52px 20px 10px 20px' }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px' }}>Quiz</div>
        <div style={{ width: 36, height: 3, background: '#7a6aa0', borderRadius: 2, marginTop: 8, marginBottom: 8 }} />
        <div style={{ fontSize: 13, color: '#6b7580' }}>
          Elke dag vijf nieuwe vragen. Snelste met de hoogste score is dagwinnaar — één poging per dag.
        </div>
      </div>

      <div style={{ padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {phase === 'start' && (
          <div style={{ background: '#274b6b', borderRadius: 16, padding: 22, color: '#f4efe6', textAlign: 'center' }}>
            <div style={{ fontSize: 40, lineHeight: 1 }}>🧠</div>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 20, marginTop: 10 }}>
              Klaar voor de quiz van vandaag?
            </div>
            <div style={{ fontSize: 13.5, color: 'rgba(244,239,230,.85)', marginTop: 6, lineHeight: 1.45 }}>
              {qSet.length} vragen. De klok start zodra je op Start drukt en stopt bij de laatste vraag.
            </div>
            <button
              onClick={start}
              style={{ width: '100%', marginTop: 16, border: 'none', cursor: 'pointer', background: '#e0a83e', color: '#274b6b', fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16, padding: 14, borderRadius: 12 }}
            >
              Start ▶
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <div style={{ background: '#274b6b', borderRadius: 16, padding: 18, color: '#f4efe6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,.18)', padding: '4px 9px', borderRadius: 999 }}>
                Vraag {qi + 1}/{qSet.length}
              </span>
              <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 15, color: '#f6d9a8' }}>
                ⏱ {fmtTime(elapsed)}
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, margin: '12px 0 10px', lineHeight: 1.35 }}>{qSet[qi].q}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {qSet[qi].o.map((label, i) => {
                let bg = '#f0ece2'
                let col = '#1f2a30'
                if (chosen != null) {
                  if (i === qSet[qi].c) {
                    bg = '#5e8c61'
                    col = '#fff'
                  } else if (i === chosen) {
                    bg = '#c15b4a'
                    col = '#fff'
                  }
                }
                return (
                  <button
                    key={i}
                    onClick={() => answer(i)}
                    style={{ textAlign: 'left', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, padding: '11px 13px', borderRadius: 11, background: bg, color: col }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, minHeight: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f6d9a8' }}>
                {chosen == null ? '' : chosen === qSet[qi].c ? 'Goed zo! ✓' : 'Helaas — het juiste antwoord staat groen.'}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(244,239,230,.7)' }}>
                Score: {score}/{qSet.length}
              </span>
            </div>
            {chosen != null && (
              <button
                onClick={() => next(score)}
                style={{ width: '100%', marginTop: 10, border: 'none', cursor: 'pointer', background: '#e0a83e', color: '#274b6b', fontWeight: 700, fontSize: 14, padding: 11, borderRadius: 11 }}
              >
                {qi + 1 >= qSet.length ? 'Klaar — bekijk uitslag' : 'Volgende vraag'}
              </button>
            )}
          </div>
        )}

        {phase === 'done' && (
          <div style={{ background: '#274b6b', borderRadius: 16, padding: 22, color: '#f4efe6', textAlign: 'center' }}>
            <div style={{ fontSize: 34, lineHeight: 1 }}>{ranked[0]?.person === userName ? '🏆' : '✅'}</div>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 20, marginTop: 8 }}>
              {score}/{qSet.length} in {fmtTime(elapsed)}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(244,239,230,.85)', marginTop: 6 }}>
              Je quiz van vandaag zit erop — je kunt maar één keer per dag meedoen. Kom morgen terug voor vijf nieuwe vragen! 🌅
            </div>
          </div>
        )}

        {/* Dagranglijst */}
        {ranked.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(31,42,48,.06)' }}>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
              Dagranglijst
            </div>
            <div style={{ fontSize: 12.5, color: '#6b7580', marginBottom: 12 }}>Hoogste score wint; bij gelijk de snelste tijd.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ranked.map((r, i) => {
                const me = r.person === userName
                return (
                  <div
                    key={r.person}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: i === 0 ? '#fdf4e3' : '#f6f2ea',
                      border: me ? '1.5px solid #274b6b' : '1.5px solid transparent',
                      borderRadius: 11,
                      padding: '9px 12px',
                    }}
                  >
                    <span style={{ fontSize: 15, width: 22, textAlign: 'center' }}>{i === 0 ? '🏆' : i + 1}</span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                      {r.person}
                      {me && <span style={{ color: '#6b7580', fontWeight: 500 }}> (jij)</span>}
                    </span>
                    <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 14 }}>
                      {r.score}/{qSet.length}
                    </span>
                    <span style={{ fontSize: 12.5, color: '#6b7580', minWidth: 42, textAlign: 'right' }}>⏱ {fmtTime(r.seconds)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
