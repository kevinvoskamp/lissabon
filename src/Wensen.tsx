import { useEffect, useRef, useState } from 'react'
import { ACTIVITIES, CATS, type Activity, type Day } from './data'
import { useRatings, type AllRatings } from './ratings'

// Sfeer-plaatje per activiteit (zelfde volgorde als ACTIVITIES)
const ACTIVITY_EMOJI = ['🏛️', '🍽️', '🌅', '🚋', '🏰', '🌳', '🎨', '⛪', '🐠', '🔬', '🛺', '🧚', '🏖️', '🌊']

// tint the category color into a soft banner gradient
function banner(color: string) {
  return `linear-gradient(135deg, ${color} 0%, ${color}cc 55%, ${color}99 100%)`
}

export default function Wensen({
  toast,
  onAddActivity,
  userName,
  days,
  activeDay,
  setActiveDay,
}: {
  toast: string
  onAddActivity: (a: Activity) => void
  userName: string
  days: Day[]
  activeDay: number
  setActiveDay: (i: number) => void
}) {
  const { all, setRating: setRatingRemote, resetPerson, synced, shared } = useRatings()
  const mine = all[userName] || {}
  const [queue, setQueue] = useState<number[]>(() =>
    ACTIVITIES.map((_, i) => i).filter((i) => mine[ACTIVITIES[i].title] == null),
  )
  const [forceResults, setForceResults] = useState(false)
  const [exit, setExit] = useState<null | 'up' | 'left'>(null)
  const [hoverStar, setHoverStar] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const reconciled = useRef(false)

  useEffect(() => () => clearTimeout(timer.current), [])

  // Zodra de gedeelde data binnen is: kaarten die ik elders al beoordeelde uit de stapel halen (eenmalig)
  useEffect(() => {
    if (!synced || reconciled.current) return
    reconciled.current = true
    setQueue((q) => q.filter((i) => mine[ACTIVITIES[i].title] == null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synced])

  const ratedCount = Object.keys(mine).length
  const total = ACTIVITIES.length
  const showResults = forceResults || queue.length === 0

  function setRating(title: string, stars: number) {
    setRatingRemote(userName, title, stars)
  }

  function rate(stars: number) {
    if (exit || queue.length === 0) return
    const idx = queue[0]
    setExit('up')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setRating(ACTIVITIES[idx].title, stars)
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
  function resetMine() {
    resetPerson(userName)
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
          Je beoordeelt als <b style={{ color: '#1f2a30' }}>{userName}</b>. Geef elk idee 1 tot 5 sterren — in de ranglijst zie je de sterren
          van iedereen.
        </div>
        <div style={{ fontSize: 11.5, color: '#a59c8c', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{ width: 7, height: 7, borderRadius: '50%', background: shared ? (synced ? '#5e8c61' : '#e0a83e') : '#c2b8a6' }}
          />
          {shared ? (synced ? 'Gedeeld met het gezin — synchroniseert live' : 'Verbinden met de gedeelde lijst…') : 'Alleen op dit apparaat opgeslagen'}
        </div>
      </div>

      {toast && (
        <div style={{ margin: '4px 20px 0', background: '#274b6b', color: '#f4efe6', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 10 }}>
          {toast}
        </div>
      )}

      {showResults ? (
        <Results
          all={all}
          userName={userName}
          setRating={setRating}
          resetMine={resetMine}
          onAddActivity={onAddActivity}
          remaining={queue.length}
          backToDeck={queue.length > 0 ? () => setForceResults(false) : undefined}
          days={days}
          activeDay={activeDay}
          setActiveDay={setActiveDay}
        />
      ) : (
        <Deck
          idx={queue[0]}
          all={all}
          userName={userName}
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

// Kleine, niet-klikbare sterrenrij voor andermans beoordeling
function StaticStars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ fontSize: size, lineHeight: 1, color: n <= value ? '#e0a83e' : '#dcd4c4' }}>
          ★
        </span>
      ))}
    </span>
  )
}

// alle beoordelingen van anderen voor één activiteit
function othersFor(all: AllRatings, userName: string, title: string) {
  return Object.keys(all)
    .filter((n) => n !== userName && all[n] && all[n][title] != null)
    .map((n) => ({ name: n, stars: all[n][title] }))
}

function Deck(props: {
  idx: number
  all: AllRatings
  userName: string
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
  const others = othersFor(props.all, props.userName, a.title)

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
          <span
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              fontSize: 11.5,
              fontWeight: 700,
              color: '#fff',
              background: 'rgba(0,0,0,.22)',
              padding: '5px 10px',
              borderRadius: 999,
            }}
          >
            ⏱ {a.dur}
          </span>
        </div>

        <div style={{ padding: '18px 18px 20px' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 20, lineHeight: 1.2, letterSpacing: '-.3px' }}>
            {a.title}
          </div>
          <div style={{ fontSize: 13.5, color: '#333', marginTop: 8, lineHeight: 1.45 }}>{a.note}</div>
          <div style={{ fontSize: 12.5, color: '#a17a4a', marginTop: 10, fontWeight: 600 }}>
            Wanneer: {a.when} · Duur: {a.dur}
          </div>

          {others.length > 0 && (
            <div style={{ marginTop: 12, background: '#f6f2ea', borderRadius: 10, padding: '9px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {others.map((o) => (
                <div key={o.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7580' }}>{o.name}</span>
                  <StaticStars value={o.stars} />
                </div>
              ))}
            </div>
          )}

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
  all: AllRatings
  userName: string
  setRating: (title: string, n: number) => void
  resetMine: () => void
  onAddActivity: (a: Activity) => void
  remaining: number
  backToDeck?: () => void
  days: Day[]
  activeDay: number
  setActiveDay: (i: number) => void
}) {
  const { all, userName, days, activeDay } = props

  const info = ACTIVITIES.map((a, i) => {
    const rs = Object.keys(all)
      .filter((n) => all[n] && all[n][a.title] != null)
      .map((n) => ({ name: n, stars: all[n][a.title] }))
    const total = rs.reduce((s, r) => s + r.stars, 0)
    return { a, i, rs, total }
  })
  const rated = info
    .filter((x) => x.rs.length > 0)
    .sort((x, y) => y.total - x.total || y.rs.length - x.rs.length || x.i - y.i)
  const unrated = info.filter((x) => x.rs.length === 0)

  return (
    <div style={{ padding: '0 20px 24px' }}>
      <div style={{ background: '#274b6b', borderRadius: 16, padding: '16px 18px', color: '#f4efe6', marginBottom: 14 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 18 }}>Jullie ranglijst</div>
        <div style={{ fontSize: 13, color: 'rgba(244,239,230,.85)', marginTop: 4 }}>
          Gesorteerd op het totaal van alle sterren bij elkaar opgeteld. Per uitje zie je wie hoeveel sterren gaf — tik op je eigen sterren om bij te stellen.
        </div>
      </div>

      {/* naar welke dag gaat "+ In planning"? */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', boxShadow: '0 1px 2px rgba(31,42,48,.05)', marginBottom: 12 }}>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7580', display: 'block', marginBottom: 7 }}>
          Inplannen op welke dag?
        </label>
        <select
          value={activeDay}
          onChange={(e) => props.setActiveDay(Number(e.target.value))}
          style={{
            width: '100%',
            border: '1px solid #e4dccd',
            borderRadius: 10,
            padding: '10px 11px',
            fontSize: 14,
            fontFamily: 'inherit',
            background: '#fff',
            color: '#1f2a30',
          }}
        >
          {days.map((d, i) => (
            <option key={i} value={i}>
              {d.title} — {d.theme}
            </option>
          ))}
        </select>
      </div>

      {rated.length === 0 && (
        <div style={{ textAlign: 'center', color: '#a59c8c', fontSize: 14, padding: '18px 10px' }}>Nog niets beoordeeld.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {rated.map(({ a, i, rs, total }) => {
          const c = CATS[a.cat] || CATS.cultuur
          const myStars = all[userName] ? all[userName][a.title] : undefined
          const others = rs.filter((r) => r.name !== userName)
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
                    {c.label} · {a.dist} · ⏱ {a.dur}
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.25 }}>{a.title}</div>
                </div>
                <span
                  style={{
                    flex: '0 0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    fontFamily: "'Bricolage Grotesque',sans-serif",
                    color: '#274b6b',
                    background: '#e9f0f4',
                    padding: '5px 10px',
                    borderRadius: 12,
                  }}
                  title={'Totaal van ' + rs.length + (rs.length === 1 ? ' persoon' : ' personen')}
                >
                  <span style={{ fontWeight: 700, fontSize: 16, lineHeight: 1 }}>★ {total}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#6b8199' }}>
                    {rs.length} {rs.length === 1 ? 'pers.' : 'pers.'}
                  </span>
                </span>
              </div>

              {/* sterren per persoon */}
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1f2a30' }}>{userName} (jij)</span>
                  <Stars value={myStars || 0} onPick={(n) => props.setRating(a.title, n)} size={19} />
                </div>
                {others.map((o) => (
                  <div key={o.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7580' }}>{o.name}</span>
                    <StaticStars value={o.stars} size={17} />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  onClick={() => props.onAddActivity(a)}
                  style={{ border: 'none', background: '#f0ece2', color: '#274b6b', fontWeight: 700, fontSize: 12.5, padding: '8px 11px', borderRadius: 10, cursor: 'pointer' }}
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
            Nog door niemand beoordeeld
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
                        {c.label} · {a.dist} · ⏱ {a.dur}
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
          onClick={props.resetMine}
          style={{ flex: 1, border: '1.5px solid #e4dccd', background: 'transparent', color: '#6b7580', fontWeight: 600, fontSize: 14, padding: 13, borderRadius: 12, cursor: 'pointer' }}
        >
          Mijn sterren wissen
        </button>
      </div>
    </div>
  )
}
