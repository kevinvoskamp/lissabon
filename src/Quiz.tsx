import { useState } from 'react'
import { QUIZ_SETS } from './data'

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

export default function Quiz() {
  const [quizQ, setQuizQ] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [score, setScore] = useState(0)

  const qSet = QUIZ_SETS[quizSetIndex()]
  const qItem = qSet[quizQ]

  function answer(idx: number) {
    if (chosen != null) return
    setChosen(idx)
    if (idx === qItem.c) setScore((s) => s + 1)
  }
  function next() {
    const n = quizQ + 1
    if (n >= qSet.length) {
      setQuizQ(0)
      setChosen(null)
      setScore(0)
    } else {
      setQuizQ(n)
      setChosen(null)
    }
  }

  const feedback = chosen == null ? '' : chosen === qItem.c ? 'Goed zo! ✓' : 'Helaas — het juiste antwoord staat groen.'

  return (
    <div>
      <div style={{ padding: '52px 20px 10px 20px' }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px' }}>Quiz</div>
        <div style={{ width: 36, height: 3, background: '#7a6aa0', borderRadius: 2, marginTop: 8, marginBottom: 8 }} />
        <div style={{ fontSize: 13, color: '#6b7580' }}>Elke dag vijf nieuwe vragen over Lissabon. Wie haalt de 5/5?</div>
      </div>

      <div style={{ padding: '8px 20px 24px' }}>
        <div style={{ background: '#274b6b', borderRadius: 16, padding: 18, color: '#f4efe6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600, fontSize: 16 }}>Lissabon-quiz van de dag</div>
            <span style={{ fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,.18)', padding: '4px 9px', borderRadius: 999 }}>
              Vraag {quizQ + 1}/{qSet.length}
            </span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, margin: '12px 0 10px', lineHeight: 1.35 }}>{qItem.q}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {qItem.o.map((label, i) => {
              let bg = '#f0ece2'
              let col = '#1f2a30'
              if (chosen != null) {
                if (i === qItem.c) {
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
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f6d9a8' }}>{feedback}</span>
            <span style={{ fontSize: 12, color: 'rgba(244,239,230,.7)' }}>
              Score: {score}/{qSet.length}
            </span>
          </div>
          {chosen != null && (
            <button
              onClick={next}
              style={{ width: '100%', marginTop: 10, border: 'none', cursor: 'pointer', background: '#e0a83e', color: '#274b6b', fontWeight: 700, fontSize: 14, padding: 11, borderRadius: 11 }}
            >
              {quizQ + 1 >= qSet.length ? 'Opnieuw beginnen' : 'Volgende vraag'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
