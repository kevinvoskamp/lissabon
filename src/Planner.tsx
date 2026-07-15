import { useEffect, useRef, useState } from 'react'
import { CATS, seed, nid, type Activity, type CatKey, type Day } from './data'
import { useWeather } from './useWeather'
import Wensen from './Wensen'
import Quiz from './Quiz'
import type { Auth } from './Login'

const KEY = 'lissabon-planner-v3'
const FAV_KEY = 'lissabon-tips-favs'
const HOTEL_URL = 'https://www.jamhotels.eu/lisbon'

type Tab = 'overview' | 'wensen' | 'planning' | 'quiz' | 'tips' | 'docs'

function loadDays(): Day[] {
  try {
    const s = localStorage.getItem(KEY)
    if (s) {
      const d = JSON.parse(s)
      if (Array.isArray(d) && d.length) return d
    }
  } catch {
    /* ignore */
  }
  return seed()
}

function loadFavs(): Record<string, boolean> {
  try {
    const f = localStorage.getItem(FAV_KEY)
    if (f) return JSON.parse(f)
  } catch {
    /* ignore */
  }
  return {}
}

function countdownText(): string {
  const start = new Date(2026, 6, 23)
  const end = new Date(2026, 6, 30)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const day = 864e5
  if (now < start) {
    const n = Math.round((start.getTime() - now.getTime()) / day)
    return n === 0 ? 'Vandaag vertrek!' : 'Nog ' + n + ' ' + (n === 1 ? 'dag' : 'dagen') + ' tot vertrek'
  }
  if (now <= end) {
    const n = Math.round((now.getTime() - start.getTime()) / day) + 1
    return 'Dag ' + n + ' van 8 · geniet ervan!'
  }
  return 'De reis zit erop'
}

export default function Planner({ auth, onLogout }: { auth: Auth; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('overview')
  const [days, setDays] = useState<Day[]>(loadDays)
  const [activeDay, setActiveDay] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftCat, setDraftCat] = useState<CatKey>('cultuur')
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [favTips, setFavTips] = useState<Record<string, boolean>>(loadFavs)
  const [toast, setToast] = useState('')

  const dragIdx = useRef<number | null>(null)
  const toastT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function persist(next: Day[]) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }
  function commit(next: Day[]) {
    persist(next)
    setDays(next)
  }

  function showToast(msg: string) {
    setToast(msg)
    clearTimeout(toastT.current)
    toastT.current = setTimeout(() => setToast(''), 2200)
  }

  // ---- planning mutations ----
  function reorder(from: number | null, to: number | null) {
    if (from == null || to == null) return
    const items = days[activeDay].items.slice()
    if (to < 0 || to >= items.length || from === to || from < 0 || from >= items.length) return
    const [m] = items.splice(from, 1)
    items.splice(to, 0, m)
    const next = days.slice()
    next[activeDay] = { ...next[activeDay], items }
    commit(next)
  }
  function removeAt(i: number) {
    const items = days[activeDay].items.slice()
    items.splice(i, 1)
    const next = days.slice()
    next[activeDay] = { ...next[activeDay], items }
    commit(next)
  }
  function toggleAt(i: number) {
    const items = days[activeDay].items.slice()
    items[i] = { ...items[i], done: !items[i].done }
    const next = days.slice()
    next[activeDay] = { ...next[activeDay], items }
    commit(next)
  }
  function confirmAdd() {
    const t = draftTitle.trim()
    if (!t) {
      setAddOpen(false)
      return
    }
    const items = days[activeDay].items.slice()
    items.push({ id: nid(), title: t, cat: draftCat, note: '', done: false })
    const next = days.slice()
    next[activeDay] = { ...next[activeDay], items }
    commit(next)
    setAddOpen(false)
    setDraftTitle('')
    setDraftCat('cultuur')
  }
  function addActivity(a: Activity) {
    const items = days[activeDay].items.slice()
    // duur mee in de notitie, zodat je bij het inplannen ziet hoeveel tijd het kost
    items.push({ id: nid(), title: a.title, cat: a.cat, note: a.dur ? a.dur + ' · ' + a.note : a.note, done: false })
    const next = days.slice()
    next[activeDay] = { ...next[activeDay], items }
    commit(next)
    const d = next[activeDay]
    showToast('Toegevoegd aan ' + d.wd + ' ' + d.dm)
  }

  // ---- favorites ----
  function toggleFav(k: string) {
    const nextFav = { ...favTips, [k]: !favTips[k] }
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(nextFav))
    } catch {
      /* ignore */
    }
    setFavTips(nextFav)
  }
  function favBtn(k: string) {
    const on = !!favTips[k]
    return {
      on,
      toggle: () => toggleFav(k),
      color: on ? '#e0a83e' : '#d8d1c2',
    }
  }

  useEffect(() => () => clearTimeout(toastT.current), [])

  const day = days[activeDay] || { items: [], wd: '', dm: '', title: '', theme: '' }
  const accent = '#274b6b'
  const muted = '#a49b8b'

  const navItems: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overzicht', icon: '🏠' },
    { key: 'wensen', label: 'Wensen', icon: '⭐' },
    { key: 'planning', label: 'Planning', icon: '📅' },
    { key: 'quiz', label: 'Quiz', icon: '🧠' },
    { key: 'tips', label: 'Tips', icon: '🎒' },
    { key: 'docs', label: 'Docs', icon: '🎫' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: '#d9d2c5' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          minHeight: '100vh',
          background: '#f4efe6',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: '0 0 60px rgba(31,42,48,.12)',
        }}
      >
        <div className="app-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: 96 }}>
          {tab === 'overview' && <Overview auth={auth} />}
          {tab === 'planning' && (
            <Planning
              days={days}
              activeDay={activeDay}
              setActiveDay={(i) => {
                setActiveDay(i)
                setAddOpen(false)
                setDragOverIdx(null)
              }}
              day={day}
              toast={toast}
              dragOverIdx={dragOverIdx}
              setDragOverIdx={setDragOverIdx}
              dragIdx={dragIdx}
              reorder={reorder}
              removeAt={removeAt}
              toggleAt={toggleAt}
              addOpen={addOpen}
              setAddOpen={setAddOpen}
              draftTitle={draftTitle}
              setDraftTitle={setDraftTitle}
              draftCat={draftCat}
              setDraftCat={setDraftCat}
              confirmAdd={confirmAdd}
            />
          )}
          {tab === 'wensen' && <Wensen toast={toast} onAddActivity={addActivity} userName={auth.name} />}
          {tab === 'quiz' && <Quiz />}
          {tab === 'tips' && <Tips favBtn={favBtn} />}
          {tab === 'docs' && <Docs onLogout={onLogout} />}
        </div>

        {/* bottom nav */}
        <div className="tile-strip" style={{ position: 'absolute', left: 0, right: 0, bottom: 80 }} />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 80,
            background: '#fff',
            display: 'flex',
            alignItems: 'stretch',
            padding: '0 8px 14px',
          }}
        >
          {navItems.map((n) => {
            const on = tab === n.key
            return (
              <button
                key={n.key}
                onClick={() => setTab(n.key)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 5,
                  paddingTop: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 19,
                    lineHeight: 1,
                    filter: on ? 'none' : 'grayscale(1) opacity(.45)',
                    transform: on ? 'scale(1.08)' : 'none',
                    transition: 'filter .15s, transform .15s',
                  }}
                >
                  {n.icon}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: on ? accent : muted }}>{n.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ===================== OVERZICHT ===================== */
function Overview({ auth }: { auth: Auth }) {
  const { weather, loading, error } = useWeather()
  return (
    <div>
      <div className="azulejo" style={{ position: 'relative', padding: '56px 24px 26px', color: '#f4efe6', overflow: 'hidden' }}>
        <div
          style={{
            fontFamily: "'Bricolage Grotesque',sans-serif",
            fontSize: 12,
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: 0.8,
            marginBottom: 10,
          }}
        >
          Familievakantie · Portugal
        </div>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 44, lineHeight: 0.95, letterSpacing: -1 }}>
          Lissabon
        </div>
        <div style={{ width: 46, height: 3, background: '#e0a83e', borderRadius: 2, marginTop: 14 }} />
        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,.18)', padding: '6px 12px', borderRadius: 999 }}>
            23 – 30 juli 2026
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,.18)', padding: '6px 12px', borderRadius: 999 }}>
            4 personen
          </span>
        </div>
        <div style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: '#f6d9a8' }}>{countdownText()}</div>
      </div>
      <div className="tile-strip" />

      <div style={{ padding: '22px 20px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 14, color: '#6b7580' }}>
          Fijn dat je er bent, <b style={{ color: '#1f2a30' }}>{auth.name}</b> 👋
        </div>

        {/* Weather card */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#e0a83e' }} />
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600, fontSize: 15 }}>Weer in Lissabon</div>
            </div>
            {weather && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 24, lineHeight: 1 }}>{weather.current.icon}</span>
                <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 22 }}>
                  {weather.current.temp}°
                </span>
              </div>
            )}
          </div>

          {loading && <div style={{ fontSize: 13, color: '#6b7580', padding: '6px 0' }}>Weer wordt opgehaald…</div>}
          {error && <div style={{ fontSize: 13, color: '#6b7580', padding: '6px 0' }}>Weer kon niet worden opgehaald.</div>}

          {weather && (
            <>
              <div style={{ fontSize: 13, color: '#6b7580', marginBottom: 12 }}>
                {weather.current.label} ·{' '}
                <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
                  bron: Open-Meteo
                </a>
              </div>
              <div className="chiprow" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                {weather.daily.map((d) => (
                  <div
                    key={d.date}
                    style={{
                      flex: '0 0 auto',
                      minWidth: 58,
                      background: '#f6f2ea',
                      borderRadius: 12,
                      padding: '10px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7580' }}>{d.wd}</span>
                    <span style={{ fontSize: 20, lineHeight: 1 }} title={d.label}>
                      {d.icon}
                    </span>
                    <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 13 }}>{d.max}°</span>
                    <span style={{ fontSize: 11, color: '#a59c8c' }}>{d.min}°</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 14 }}>Reisoverzicht</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
            <Row label="Periode" value="do 23 – do 30 juli" />
            <Row label="Duur" value="8 dagen / 7 nachten" />
            <Row label="Reisgezelschap" value="2 volw. + 2 kinderen" />
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#3d7ea6' }} />
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600, fontSize: 15 }}>Vluchten — Transavia</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FlightLeg dir="Heen · do 23 juli" fromT="16:00" fromP="Rotterdam" toT="17:55" toP="Lissabon" nr="HV5243" />
            <div style={{ height: 1, background: '#eee5d6' }} />
            <FlightLeg dir="Terug · do 30 juli" fromT="18:40" fromP="Lissabon" toT="22:30" toP="Rotterdam" nr="HV5244" />
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#b5674a' }} />
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600, fontSize: 15 }}>Verblijf</div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            <a href={HOTEL_URL} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              JAM Hotel Lissabon ↗
            </a>
          </div>
          <div style={{ fontSize: 13, color: '#6b7580', marginTop: 4 }}>Check-in do 23 juli · check-out do 30 juli</div>
        </Card>

        <Card>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Vaste dagtrips</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: '#e9f0f4', borderLeft: '3px solid #274b6b', borderRadius: 10, padding: '12px 13px' }}>
              <div style={{ fontSize: 12, color: '#6b7580' }}>zondag 26 juli</div>
              <div style={{ fontWeight: 700, fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 17, marginTop: 2 }}>Sintra</div>
            </div>
            <div style={{ flex: 1, background: '#f6ece3', borderLeft: '3px solid #c56b4a', borderRadius: 10, padding: '12px 13px' }}>
              <div style={{ fontSize: 12, color: '#6b7580' }}>dinsdag 28 juli</div>
              <div style={{ fontWeight: 700, fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 17, marginTop: 2 }}>Cascais</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '18px 18px', boxShadow: '0 1px 3px rgba(31,42,48,.06)' }}>{children}</div>
  )
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#6b7580' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}
function FlightLeg({ dir, fromT, fromP, toT, toP, nr }: { dir: string; fromT: string; fromP: string; toT: string; toP: string; nr: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: '#6b7580', marginBottom: 8 }}>{dir}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 20 }}>{fromT}</div>
          <div style={{ fontSize: 12, color: '#6b7580' }}>{fromP}</div>
        </div>
        <div style={{ flex: 1, height: 2, background: '#c9bfae', position: 'relative', borderRadius: 2 }}>
          <span
            style={{
              position: 'absolute',
              top: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 11,
              color: '#6b7580',
              background: '#fff',
              padding: '0 6px',
            }}
          >
            {nr}
          </span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 20 }}>{toT}</div>
          <div style={{ fontSize: 12, color: '#6b7580' }}>{toP}</div>
        </div>
      </div>
    </div>
  )
}

/* ===================== PLANNING ===================== */
function Planning(props: {
  days: Day[]
  activeDay: number
  setActiveDay: (i: number) => void
  day: Day
  toast: string
  dragOverIdx: number | null
  setDragOverIdx: (i: number | null) => void
  dragIdx: React.MutableRefObject<number | null>
  reorder: (from: number | null, to: number | null) => void
  removeAt: (i: number) => void
  toggleAt: (i: number) => void
  addOpen: boolean
  setAddOpen: (v: boolean) => void
  draftTitle: string
  setDraftTitle: (v: string) => void
  draftCat: CatKey
  setDraftCat: (c: CatKey) => void
  confirmAdd: () => void
}) {
  const { days, activeDay, setActiveDay, day, toast, dragOverIdx, setDragOverIdx, dragIdx } = props
  const rowBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    background: '#fff',
    borderRadius: 14,
    padding: '11px 12px 11px 8px',
    boxShadow: '0 1px 2px rgba(31,42,48,.05)',
    transition: 'transform .08s,box-shadow .08s',
  }

  return (
    <div>
      <div style={{ padding: '52px 20px 6px 20px', background: '#f4efe6', position: 'sticky', top: 0, zIndex: 5 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px' }}>Planning</div>
        <div style={{ width: 36, height: 3, background: '#c56b4a', borderRadius: 2, marginTop: 8 }} />
        <div style={{ fontSize: 12.5, color: '#a59c8c', marginTop: 8 }}>
          Geen strak uurschema — sleep de volgorde die jullie het fijnst vinden.
        </div>
      </div>
      {toast && (
        <div style={{ margin: '0 20px 4px', background: '#274b6b', color: '#f4efe6', fontSize: 13, fontWeight: 600, padding: '9px 14px', borderRadius: 10 }}>
          {toast}
        </div>
      )}
      <div
        className="chiprow"
        style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 20px 14px', position: 'sticky', top: 44, background: '#f4efe6', zIndex: 5 }}
      >
        {days.map((d, i) => {
          const active = i === activeDay
          return (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              style={{
                flex: '0 0 auto',
                minWidth: 52,
                border: 'none',
                cursor: 'pointer',
                borderRadius: 13,
                padding: '9px 6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                ...(active
                  ? { background: '#274b6b', color: '#f4efe6' }
                  : { background: '#fff', color: '#2f3b42', boxShadow: '0 1px 2px rgba(31,42,48,.05)' }),
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.7 }}>{d.wd}</span>
              <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16, lineHeight: 1 }}>{d.dm}</span>
            </button>
          )
        })}
      </div>

      <div style={{ padding: '4px 20px 8px' }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600, fontSize: 19 }}>{day.title}</div>
        <div style={{ fontSize: 13, color: '#6b7580', marginTop: 2 }}>{day.theme}</div>
      </div>

      <div style={{ padding: '6px 16px 8px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {day.items.map((it, i) => {
          const c = CATS[it.cat] || CATS.praktisch
          const over = dragOverIdx === i
          return (
            <div
              key={it.id}
              draggable
              onDragStart={(e) => {
                dragIdx.current = i
                try {
                  e.dataTransfer.effectAllowed = 'move'
                } catch {
                  /* ignore */
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                if (dragOverIdx !== i) setDragOverIdx(i)
              }}
              onDrop={(e) => {
                e.preventDefault()
                props.reorder(dragIdx.current, i)
              }}
              onDragEnd={() => {
                setDragOverIdx(null)
                dragIdx.current = null
              }}
              style={{ ...rowBase, ...(over ? { boxShadow: '0 0 0 2px #274b6b', transform: 'scale(1.01)' } : null) }}
            >
              <div style={{ cursor: 'grab', padding: '2px 2px', display: 'flex', alignItems: 'center' }} title="Sleep om te verplaatsen">
                <svg width="12" height="20" viewBox="0 0 12 20">
                  <circle cx="3" cy="4" r="1.6" fill="#c2b8a6" />
                  <circle cx="9" cy="4" r="1.6" fill="#c2b8a6" />
                  <circle cx="3" cy="10" r="1.6" fill="#c2b8a6" />
                  <circle cx="9" cy="10" r="1.6" fill="#c2b8a6" />
                  <circle cx="3" cy="16" r="1.6" fill="#c2b8a6" />
                  <circle cx="9" cy="16" r="1.6" fill="#c2b8a6" />
                </svg>
              </div>
              <span style={{ flex: '0 0 auto', width: 10, height: 10, borderRadius: '50%', background: c.color }} />
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => props.toggleAt(i)}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#6b7580', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  {c.label}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    lineHeight: 1.25,
                    cursor: 'pointer',
                    ...(it.done ? { textDecoration: 'line-through', opacity: 0.45 } : null),
                  }}
                >
                  {it.title}
                </div>
                {it.note && <div style={{ fontSize: 12.5, color: '#8a8f96', marginTop: 3, lineHeight: 1.35 }}>{it.note}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <button
                  onClick={() => props.reorder(i, i - 1)}
                  style={{ border: 'none', background: '#f0ece2', color: '#8a8f96', width: 24, height: 20, borderRadius: 6, cursor: 'pointer', fontSize: 11, lineHeight: 1 }}
                >
                  ▲
                </button>
                <button
                  onClick={() => props.reorder(i, i + 1)}
                  style={{ border: 'none', background: '#f0ece2', color: '#8a8f96', width: 24, height: 20, borderRadius: 6, cursor: 'pointer', fontSize: 11, lineHeight: 1 }}
                >
                  ▼
                </button>
              </div>
              <button
                onClick={() => props.removeAt(i)}
                style={{ border: 'none', background: 'transparent', color: '#c4a99a', width: 22, height: 22, borderRadius: 6, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          )
        })}

        {day.items.length === 0 && (
          <div style={{ textAlign: 'center', color: '#a59c8c', fontSize: 14, padding: '24px 10px' }}>
            Nog niets gepland voor deze dag.
            <br />
            Voeg hieronder iets toe.
          </div>
        )}
      </div>

      {/* add */}
      <div style={{ padding: '8px 20px 24px' }}>
        {!props.addOpen ? (
          <button
            onClick={() => props.setAddOpen(true)}
            style={{
              width: '100%',
              border: '1.5px dashed #c9bfae',
              background: 'transparent',
              color: '#6b7580',
              fontWeight: 600,
              fontSize: 14,
              padding: 14,
              borderRadius: 14,
              cursor: 'pointer',
            }}
          >
            + Activiteit toevoegen
          </button>
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 3px rgba(31,42,48,.06)' }}>
            <input
              value={props.draftTitle}
              onChange={(e) => props.setDraftTitle(e.target.value)}
              placeholder="Wat gaan jullie doen?"
              style={{
                width: '100%',
                border: '1px solid #e4dccd',
                borderRadius: 10,
                padding: '11px 12px',
                fontSize: 14,
                fontFamily: 'inherit',
                marginBottom: 12,
              }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {(Object.keys(CATS) as CatKey[]).map((k) => {
                const sel = props.draftCat === k
                return (
                  <button
                    key={k}
                    onClick={() => props.setDraftCat(k)}
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '7px 11px',
                      borderRadius: 999,
                      ...(sel ? { background: CATS[k].color, color: '#fff' } : { background: '#f0ece2', color: '#6b7580' }),
                    }}
                  >
                    {CATS[k].label}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  props.setAddOpen(false)
                  props.setDraftTitle('')
                }}
                style={{ flex: 1, border: 'none', background: '#f0ece2', color: '#6b7580', fontWeight: 600, fontSize: 14, padding: 12, borderRadius: 11, cursor: 'pointer' }}
              >
                Annuleren
              </button>
              <button
                onClick={props.confirmAdd}
                style={{ flex: 2, border: 'none', background: '#274b6b', color: '#f4efe6', fontWeight: 600, fontSize: 14, padding: 12, borderRadius: 11, cursor: 'pointer' }}
              >
                Toevoegen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ===================== TIPS ===================== */
function Tips(props: { favBtn: (k: string) => { on: boolean; toggle: () => void; color: string } }) {
  return (
    <div>
      <div style={{ padding: '52px 20px 10px 20px' }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px' }}>Tips voor Lissabon</div>
        <div style={{ width: 36, height: 3, background: '#e0a83e', borderRadius: 2, marginTop: 8, marginBottom: 8 }} />
        <div style={{ fontSize: 13, color: '#6b7580' }}>Handig voor een gezin met kinderen (9–12) met het openbaar vervoer.</div>
      </div>
      <div style={{ padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <TipCard dot="#3d7ea6" title="Vervoer" fav={props.favBtn('vervoer')}>
          <li>
            Koop een <b>Navegante-kaart</b> (€0,50) en laad hem op — tikken is goedkoper dan losse kaartjes.
          </li>
          <li>
            Kinderen 4–12 jaar reizen voor <b>half geld</b> op de trein.
          </li>
          <li>Er is een 24-uurs pas (~€11) die de trein naar Sintra én Cascais meeneemt.</li>
          <li>
            Maak zeker een ritje met de beroemde <b>tram 28</b> door Alfama — vroeg = minder druk.
          </li>
          <li>Lissabon heeft 7 heuvels: laat de buggy thuis, kinderen van deze leeftijd lopen prima mee.</li>
        </TipCard>

        <TipCard dot="#7a6aa0" title="Dagtrip Sintra" fav={props.favBtn('sintra')}>
          <li>
            Trein vanaf station <b>Rossio</b> (~40 min). Start vroeg — 's zomers lange rijen.
          </li>
          <li>
            Bij het station de <b>434-bus</b> (24u-ticket ~€13,50) naar Pena Palace & Moorse kasteel.
          </li>
          <li>
            Boek tickets voor <b>Palácio da Pena</b> vooraf online.
          </li>
          <li>Sintra heeft een eigen microklimaat — neem een dun jasje mee, ook in juli.</li>
          <li>Met kinderen leuk: het kleurrijke sprookjespaleis Pena en de geheime put van Quinta da Regaleira.</li>
        </TipCard>

        <TipCard dot="#3d7ea6" title="Dagtrip Cascais" fav={props.favBtn('cascais')}>
          <li>
            Directe trein vanaf <b>Cais do Sodré</b> (35–40 min, elke ~20 min). Geen overstap.
          </li>
          <li>
            Ga <b>links zitten</b> in de trein voor het mooiste kustuitzicht.
          </li>
          <li>Vlak, wandelbaar stadje met rustige stadsstranden — makkelijk met kinderen.</li>
          <li>Tip: pak vooraf een pastel de nata bij de Time Out Market naast het station.</li>
        </TipCard>

        <TipCard dot="#5e8c61" title="Leuk met de kinderen" fav={props.favBtn('kinderen')}>
          <li>
            <b>Oceanário de Lisboa</b> — één van de grootste aquariums van Europa, 8.000+ zeedieren. Tickets online.
          </li>
          <li>
            <b>Pavilhão do Conhecimento</b> — doe-wetenschapsmuseum, familieticket ~€27.
          </li>
          <li>
            <b>Kabelbaan (Telecabine)</b> langs de Taag in Parque das Nações.
          </li>
          <li>
            <b>Castelo de São Jorge</b> — kasteelmuren, uitzicht en vrij rondlopende pauwen.
          </li>
          <li>
            <b>Hippotrip</b> — amfibiebus die over land én water gaat (vooraf reserveren).
          </li>
        </TipCard>

        <TipCard dot="#c99a3f" title="Eten & praktisch" fav={props.favBtn('eten')}>
          <li>
            Proef <b>pastéis de nata</b> — het origineel in Belém, maar overal lekker.
          </li>
          <li>
            <b>Time Out Market</b> (Mercado da Ribeira): grote foodhal, voor elk kind wat.
          </li>
          <li>Juli is warm — neem water, petjes en zonnebrand mee.</li>
          <li>Boek toegangstickets voor drukke attracties vooraf om rijen te vermijden.</li>
        </TipCard>
      </div>
    </div>
  )
}

function TipCard({ dot, title, fav, children }: { dot: string; title: string; fav: { on: boolean; toggle: () => void; color: string }; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(31,42,48,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: dot }} />
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600, fontSize: 16 }}>{title}</div>
        </div>
        <button
          onClick={fav.toggle}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 19, lineHeight: 1, padding: 2, color: fav.color }}
          aria-label="Favoriet"
        >
          ★
        </button>
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.55, color: '#333' }}>{children}</ul>
    </div>
  )
}

/* ===================== DOCUMENTEN ===================== */
function Docs({ onLogout }: { onLogout: () => void }) {
  return (
    <div>
      <div style={{ padding: '52px 20px 10px 20px' }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px' }}>Documenten</div>
        <div style={{ width: 36, height: 3, background: '#274b6b', borderRadius: 2, marginTop: 8, marginBottom: 8 }} />
        <div style={{ fontSize: 13, color: '#6b7580' }}>Alle belangrijke reisgegevens op één plek.</div>
      </div>
      <div style={{ padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 10 }}>Heenvlucht — HV5243</div>
          <div style={{ fontSize: 13, color: '#6b7580', marginBottom: 10 }}>Rotterdam/Den Haag → Lissabon · do 23 juli 2026</div>
          <div style={{ display: 'flex', gap: 22, fontSize: 14 }}>
            <TimeCol label="Vertrek" value="16:00" />
            <TimeCol label="Aankomst" value="17:55" />
            <TimeCol label="Duur" value="2u55" />
          </div>
          <div style={{ fontSize: 11.5, color: '#a59c8c', marginTop: 10 }}>Getoonde tijden zijn lokale tijden</div>
        </Card>

        <Card>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 10 }}>Terugvlucht — HV5244</div>
          <div style={{ fontSize: 13, color: '#6b7580', marginBottom: 10 }}>Lissabon → Rotterdam/Den Haag · do 30 juli 2026</div>
          <div style={{ display: 'flex', gap: 22, fontSize: 14 }}>
            <TimeCol label="Vertrek" value="18:40" />
            <TimeCol label="Aankomst" value="22:30" />
            <TimeCol label="Duur" value="2u50" />
          </div>
          <div style={{ fontSize: 11.5, color: '#a59c8c', marginTop: 10 }}>Getoonde tijden zijn lokale tijden</div>
        </Card>

        <Card>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Passagiers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Passenger
              name="Kevin Voskamp"
              lines={['Volwassene · geb. 2-5-1987', 'Ruimbagage 15 kg · handbagage 40×30×20 cm', 'kevinvoskamp@hotmail.com · +31 6 23718928']}
              border
            />
            <Passenger
              name="Danielle Voskamp"
              lines={['Volwassene · geb. 26-2-1990 · stoel 25E', 'Ruimbagage 15 kg · handbagage 40×30×20 cm', 'd.voskamp@hotmail.com · +31 6 20857364']}
              border
            />
            <Passenger name="Maura Voskamp" lines={['Kind · geb. 20-5-2015 · stoel 25F', 'Handbagage 40×30×20 cm']} border />
            <Passenger name="Lieke Voskamp" lines={['Kind · geb. 8-5-2017 · stoel 25D', 'Handbagage 40×30×20 cm']} />
          </div>
        </Card>

        <Card>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Contact</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Kevin Voskamp</div>
          <div style={{ fontSize: 13, color: '#6b7580', marginTop: 2 }}>+31 6 23718928 · kevinvoskamp@hotmail.com</div>
        </Card>

        <button
          onClick={onLogout}
          style={{
            width: '100%',
            border: '1.5px solid #e4dccd',
            background: 'transparent',
            color: '#6b7580',
            fontWeight: 600,
            fontSize: 14,
            padding: 13,
            borderRadius: 12,
            cursor: 'pointer',
            marginTop: 4,
          }}
        >
          Uitloggen
        </button>
      </div>
    </div>
  )
}

function TimeCol({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: '#6b7580', fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  )
}
function Passenger({ name, lines, border }: { name: string; lines: string[]; border?: boolean }) {
  return (
    <div style={border ? { borderBottom: '1px solid #f0ece2', paddingBottom: 12 } : undefined}>
      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{name}</div>
      {lines.map((l, i) => (
        <div key={i} style={{ fontSize: 12.5, color: '#6b7580', marginTop: 2 }}>
          {l}
        </div>
      ))}
    </div>
  )
}
