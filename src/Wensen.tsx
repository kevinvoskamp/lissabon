import { useEffect, useRef, useState } from 'react'
import { ACTIVITIES, CATS, type Activity } from './data'

const KEY = 'lissabon-wensen-v1'

// Sfeer-plaatje per activiteit (zelfde volgorde als ACTIVITIES)
const ACTIVITY_EMOJI = ['🏛️', '🍽️', '🌅', '🚋', '🏰', '🌳', '🎨', '⛪', '🐠', '🔬', '🛺', '🧚', '🏖️', '🌊']

type Ratings = Record<string, number>

function loadRatings(): Ratings {
  try {
    const s = localStorage.getItem(KEY)
    if (s) return JSON.parse(s)
  } catch {
    /* ignore */
  }
  return {}
}
function saveRatings(r: Ratings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(r))
  } catch {
    /* ignore */
  }
}

// tint the category color into a soft banner gradient
function banner(color: string) {
  return `linear-gradient(135deg, ${color} 0%, ${color}cc 55%, ${color}99 100%)`
}

export default function Wensen({ toast, onAddActivity }: { toast: string; onAddActivity: (a: Activity) => void }) {
  const [ratings, setRatings] = useState<Ratings>(loadRatings)
  const [queue, setQueue] = useState<number[]>(() =>
    ACTIVITIES.map((_, i) => i).filter((i) => ratings[ACTIVITIES[i].title] == null),
  )
  const [forceResults, setForceResults] = useState(false)
  const [exit, setExit] = useState<null | 'up' | 'left'>(null)
  const [hoverStar, setHoverStar] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const ratedCount = Object.keys(ratings).length
  const total = ACTIVITIES.length
  const showResults = forceResults || queue.length === 0

  function persist(next: Ratings) {
    saveRatings(next)
    setRatings(next)
  }

  function rate(stars: number) {
    if (exit || queue.length === 0) return
    const idx = queue[0]
    setExit('up')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      persist({ ...ratings, [ACTIVITIES[idx].title]: stars })
      setQueue((q) => q.slice(1))
      setExit(null)
      setHoverStar(0)
    }, 240)
  }
  function skip() {
    if (exit || queue.length === 0) return
    setExit('left')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setQueue((q) => (q.length > 1 ? [...q.slice(1), q[0]] : q))
      setExit(null)
      setHoverStar(0)
    }, 240)
  }
  function setRating(title: string, stars: number) {
    persist({ ...ratings, [title]: stars })
  }
  function resetAll() {
    saveRatings({})
    setRatings({})
    setQueue(ACTIVITIES.map((_, i) => i))
    setForceResults(false)
    setHoverStar(0)
  }

  return (
    <div>
      <div style={{ padding: '52px 20px 8px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px' }}>Wensen</div>
          {ratedCount > 0 && !showResults && (
            <button
              onClick={() => setForceResults(true)}
              style={{ border: 'none', background: 'transparent', color: '#274b6b', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 2 }}
            >
              Ranglijst →
            </button>
          )}
        </div>
        <div style={{ width: 36, height: 3, background: '#c99a3f', borderRadius: 2, marginTop: 8, marginBottom: 8 }} />
        <div style={{ fontSize: 13, color: '#6b7580' }}>
          Geef elk idee 1 tot 5 sterren. Zo zien we samen wat het beste past. Na je beoordeling verschijnt vanzelf het volgende.
        </div>
      </div>

      {toast && (
        <div style={{ margin: '4px 20px 0', background: '#274b6b', color: '#f4efe6', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 10 }}>
          {toast}
        </div>
      )}

      {showResults ? (
        <Results
          ratings={ratings}
          setRating={setRating}
          resetAll={resetAll}
          onAddActivity={onAddActivity}
          remaining={queue.length}
          backToDeck={queue.length > 0 ? () => setForceResults(false) : undefined}
        />
      ) : (
        <Deck
          idx={queue[0]}
          exit={exit}
          hoverStar={hoverStar}
          setHoverStar={setHoverStar}
          rate={rate}
          skip={skip}
          done={ratedCount}
          left={queue.length}
          total={total}
        />
      )}
    </div>
  )
}

function Stars({
  value,
  hover,
  onHover,
  onLeave,
  onPick,
  size = 34,
}: {
  value: number
  hover?: number
  onHover?: (n: number) => void
  onLeave?: () => void
  onPick: (n: number) => void
  size?: number
}) {
  const shown = hover || value
  return (
    <div style={{ display: 'flex', gap: 4 }} onMouseLeave={onLeave}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onPick(n)}
          onMouseEnter={onHover ? () => onHover(n) : undefined}
          aria-label={n + ' ' + (n === 1 ? 'ster' : 'sterren')}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 2,
            fontSize: size,
            lineHeight: 1,
            color: n <= shown ? '#e0a83e' : '#dcd4c4',
            transition: 'transform .08s',
            transform: hover === n ? 'scale(1.15)' : 'none',
          }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function Deck(props: {
  idx: number
  exit: null | 'up' | 'left'
  hoverStar: number
  setHoverStar: (n: number) => void
  rate: (n: number) => void
  skip: () => void
  done: number
  left: number
  total: number
}) {
  const a = ACTIVITIES[props.idx]
  const c = CATS[a.cat] || CATS.cultuur
  const emoji = ACTIVITY_EMOJI[props.idx] || '📍'

  const exitStyle: React.CSSProperties =
    props.exit === 'up'
      ? { transform: 'translateY(-40px) scale(.96)', opacity: 0 }
      : props.exit === 'left'
        ? { transform: 'translateX(-120%) rotate(-6deg)', opacity: 0 }
        : { transform: 'none', opacity: 1 }

  return (
    <div style={{ padding: '4px 20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12.5, color: '#6b7580', fontWeight: 600 }}>
          Nog {props.left} te gaan
        </span>
        <span style={{ fontSize: 12.5, color: '#a59c8c' }}>
          {props.done}/{props.total} beoordeeld
        </span>
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 8px 26px rgba(31,42,48,.14)',
          transition: 'transform .24s ease, opacity .24s ease',
          ...exitStyle,
        }}
      >
        {/* plaatje */}
        <div
          style={{
            height: 158,
            background: banner(c.color),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div className="tile-strip" style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity: 0.5 }} />
          <span style={{ fontSize: 76, lineHeight: 1, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.18))' }}>{emoji}</span>
          <span
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              color: '#fff',
              background: 'rgba(0,0,0,.22)',
              padding: '5px 10px',
              borderRadius: 999,
            }}
          >
            {c.label} · {a.dist}
          </span>
        </div>

        <div style={{ padding: '18px 18px 20px' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 20, lineHeight: 1.2, letterSpacing: '-.3px' }}>
            {a.title}
          </div>
          <div style={{ fontSize: 13.5, color: '#333', marginTop: 8, lineHeight: 1.45 }}>{a.note}</div>
          <div style={{ fontSize: 12.5, color: '#a17a4a', marginTop: 10, fontWeight: 600 }}>Wanneer: {a.when}</div>

          <div style={{ height: 1, background: '#f0ece2', margin: '16px 0 14px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Stars
              value={0}
              hover={props.hoverStar}
              onHover={props.setHoverStar}
              onLeave={() => props.setHoverStar(0)}
              onPick={props.rate}
            />
            <div style={{ fontSize: 12, color: '#a59c8c' }}>
              {props.hoverStar > 0 ? RATING_LABEL[props.hoverStar] : 'Tik op een ster om te beoordelen'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
        <button
          onClick={props.skip}
          style={{ border: 'none', background: 'transparent', color: '#a59c8c', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', padding: 6 }}
        >
          Later beslissen — sla over
        </button>
      </div>
    </div>
  )
}

const RATING_LABEL: Record<number, string> = {
  1: 'Hoeft voor mij niet',
  2: 'Alleen als er tijd over is',
  3: 'Wel leuk',
  4: 'Graag!',
  5: 'Dit moeten we echt doen',
}

function Results(props: {
  ratings: Ratings
  setRating: (title: string, n: number) => void
  resetAll: () => void
  onAddActivity: (a: Activity) => void
  remaining: number
  backToDeck?: () => void
}) {
  const rated = ACTIVITIES.map((a, i) => ({ a, i }))
    .filter(({ a }) => props.ratings[a.title] != null)
    .sort((x, y) => props.ratings[y.a.title] - props.ratings[x.a.title] || x.i - y.i)
  const unrated = ACTIVITIES.map((a, i) => ({ a, i })).filter(({ a }) => props.ratings[a.title] == null)

  return (
    <div style={{ padding: '0 20px 24px' }}>
      <div style={{ background: '#274b6b', borderRadius: 16, padding: '16px 18px', color: '#f4efe6', marginBottom: 14 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 18 }}>Jullie ranglijst</div>
        <div style={{ fontSize: 13, color: 'rgba(244,239,230,.85)', marginTop: 4 }}>
          Gesorteerd op sterren — bovenaan staat wat het beste past. Tik op de sterren om bij te stellen.
        </div>
      </div>

      {rated.length === 0 && (
        <div style={{ textAlign: 'center', color: '#a59c8c', fontSize: 14, padding: '18px 10px' }}>Nog niets beoordeeld.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {rated.map(({ a, i }) => {
          const c = CATS[a.cat] || CATS.cultuur
          return (
            <div key={a.title} style={{ background: '#fff', borderRadius: 14, padding: 12, boxShadow: '0 1px 2px rgba(31,42,48,.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div
                  style={{
                    flex: '0 0 auto',
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: banner(c.color),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}
                >
                  {ACTIVITY_EMOJI[i] || '📍'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7580', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    {c.label} · {a.dist}
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.25 }}>{a.title}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
                <Stars value={props.ratings[a.title]} onPick={(n) => props.setRating(a.title, n)} size={22} />
                <button
                  onClick={() => props.onAddActivity(a)}
                  style={{ border: 'none', background: '#f0ece2', color: '#274b6b', fontWeight: 700, fontSize: 12.5, padding: '8px 11px', borderRadius: 10, cursor: 'pointer', flex: '0 0 auto' }}
                >
                  + In planning
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {unrated.length > 0 && (
        <>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#a59c8c', textTransform: 'uppercase', letterSpacing: 0.4, margin: '20px 0 8px' }}>
            Nog niet beoordeeld
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {unrated.map(({ a, i }) => {
              const c = CATS[a.cat] || CATS.cultuur
              return (
                <div key={a.title} style={{ background: '#fff', borderRadius: 14, padding: 12, boxShadow: '0 1px 2px rgba(31,42,48,.05)', opacity: 0.9 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div
                      style={{
                        flex: '0 0 auto',
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#f0ece2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                      }}
                    >
                      {ACTIVITY_EMOJI[i] || '📍'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7580', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                        {c.label} · {a.dist}
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.25 }}>{a.title}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <Stars value={0} onPick={(n) => props.setRating(a.title, n)} size={22} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        {props.backToDeck && (
          <button
            onClick={props.backToDeck}
            style={{ flex: 1, border: 'none', background: '#274b6b', color: '#f4efe6', fontWeight: 600, fontSize: 14, padding: 13, borderRadius: 12, cursor: 'pointer' }}
          >
            Verder beoordelen ({props.remaining})
          </button>
        )}
        <button
          onClick={props.resetAll}
          style={{ flex: 1, border: '1.5px solid #e4dccd', background: 'transparent', color: '#6b7580', fontWeight: 600, fontSize: 14, padding: 13, borderRadius: 12, cursor: 'pointer' }}
        >
          Opnieuw beginnen
        </button>
      </div>
    </div>
  )
}
