import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ACTIVITIES, ACTIVITY_GEO, CATS, HOTEL_GEO } from './data'
import { useRatings } from './ratings'

const POINTS = ACTIVITIES.map((a, i) => ({ i, a, geo: ACTIVITY_GEO[i], n: i + 1 }))
const CITY = POINTS.filter((p) => !p.geo.dayTrip)

const ZONE_ORDER = ['Baixa & Alfama', 'Cais do Sodré', 'Centrum-noord', 'Belém & LX', 'Parque das Nações', 'Vlak bij het hotel', 'Dagtrips']

// Gemiddelde sterren van het gezin, naast een plek in de lijst
function Score({ info }: { info: { avg: number; count: number } | null }) {
  if (!info)
    return (
      <span style={{ flex: '0 0 auto', fontSize: 11, color: '#c2b8a6', fontWeight: 600 }} title="Nog niemand heeft dit beoordeeld">
        –
      </span>
    )
  return (
    <span
      style={{
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        lineHeight: 1.15,
      }}
      title={`Gemiddelde van ${info.count} ${info.count === 1 ? 'persoon' : 'personen'}`}
    >
      <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 13.5, color: '#a17a4a' }}>
        ★ {info.avg.toFixed(1).replace('.', ',')}
      </span>
      <span style={{ fontSize: 10, color: '#a59c8c' }}>{info.count} pers.</span>
    </span>
  )
}

// Genummerde speld in de categoriekleur
function pinIcon(n: number, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      background:${color};border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center">
      <span style="transform:rotate(45deg);color:#fff;font-size:12px;font-weight:700;font-family:system-ui,sans-serif">${n}</span>
     </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  })
}
function hotelIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:50%;background:#274b6b;border:3px solid #e0a83e;
      box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:14px">★</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  })
}

export default function Kaart() {
  const elRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [scope, setScope] = useState<'stad' | 'alles'>('stad')
  const { all } = useRatings()

  // gemiddelde sterren van het hele gezin voor één activiteit
  function avgFor(title: string) {
    const vals = Object.keys(all)
      .map((p) => all[p]?.[title])
      .filter((v): v is number => v != null)
    if (!vals.length) return null
    return { avg: vals.reduce((s, v) => s + v, 0) / vals.length, count: vals.length }
  }

  // kaart eenmalig opbouwen
  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    // begin met een zinnige weergave; fitBounds hieronder stelt 'm daarna precies in
    const map = L.map(elRef.current, { scrollWheelZoom: false, attributionControl: true }).setView([38.722, -9.14], 12)
    mapRef.current = map

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)

    L.marker([HOTEL_GEO.lat, HOTEL_GEO.lng], { icon: hotelIcon(), zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup('<b>JAM Hotel Lissabon</b><br>Ons verblijf')

    POINTS.forEach((p) => {
      const c = CATS[p.a.cat] || CATS.cultuur
      L.marker([p.geo.lat, p.geo.lng], { icon: pinIcon(p.n, c.color) })
        .addTo(map)
        .bindPopup(`<b>${p.n}. ${p.a.title}</b><br>${c.label} · ${p.a.dist} v.a. hotel<br>⏱ ${p.a.dur}`)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // uitsnede aanpassen: alleen de stad, of inclusief de dagtrips
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const pts = scope === 'stad' ? CITY : POINTS
    const bounds = L.latLngBounds([
      [HOTEL_GEO.lat, HOTEL_GEO.lng],
      ...pts.map((p) => [p.geo.lat, p.geo.lng] as [number, number]),
    ])
    // wacht op de layout, anders rekent Leaflet met een verkeerde containergrootte
    const t = setTimeout(() => {
      map.invalidateSize()
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15, animate: false })
    }, 80)
    return () => clearTimeout(t)
  }, [scope])

  const zones = ZONE_ORDER.map((z) => ({ zone: z, pts: POINTS.filter((p) => p.geo.zone === z) })).filter((g) => g.pts.length)

  const tabBtn = (v: 'stad' | 'alles', label: string) => (
    <button
      onClick={() => setScope(v)}
      style={{
        border: 'none',
        cursor: 'pointer',
        fontSize: 12.5,
        fontWeight: 600,
        padding: '7px 13px',
        borderRadius: 999,
        background: scope === v ? '#274b6b' : '#f0ece2',
        color: scope === v ? '#f4efe6' : '#6b7580',
      }}
    >
      {label}
    </button>
  )

  return (
    <div>
      <div style={{ padding: '52px 20px 10px 20px' }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px' }}>Kaart</div>
        <div style={{ width: 36, height: 3, background: '#3d7ea6', borderRadius: 2, marginTop: 8, marginBottom: 8 }} />
        <div style={{ fontSize: 13, color: '#6b7580' }}>
          Tik op een speld voor de details. Wat dicht bij elkaar ligt, kun je goed op één dag doen.
        </div>
        <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
          {tabBtn('stad', 'Stad')}
          {tabBtn('alles', 'Met dagtrips')}
        </div>
      </div>

      <div style={{ padding: '4px 16px 8px' }}>
        <div
          ref={elRef}
          style={{ height: 340, width: '100%', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(31,42,48,.06)', zIndex: 0 }}
        />
      </div>

      {/* per gebied — laat zien wat te combineren is */}
      <div style={{ padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {zones.map((g) => (
          <div key={g.zone} style={{ background: '#fff', borderRadius: 14, padding: 14, boxShadow: '0 1px 2px rgba(31,42,48,.05)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 15 }}>{g.zone}</div>
              {g.pts.length > 1 && g.zone !== 'Dagtrips' && (
                <span style={{ fontSize: 11, fontWeight: 600, color: '#5e8c61' }}>goed samen te doen</span>
              )}
              {g.zone === 'Dagtrips' && <span style={{ fontSize: 11, fontWeight: 600, color: '#a17a4a' }}>elk een aparte dag</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {g.pts.map((p) => {
                const c = CATS[p.a.cat] || CATS.cultuur
                return (
                  <div
                    key={p.i}
                    onClick={() => {
                      const map = mapRef.current
                      if (!map) return
                      if (p.geo.dayTrip && scope === 'stad') setScope('alles')
                      setTimeout(() => map.setView([p.geo.lat, p.geo.lng], 15, { animate: false }), 60)
                      document.querySelector('.app-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                  >
                    <span
                      style={{
                        flex: '0 0 auto',
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: c.color,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {p.n}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{p.a.title}</div>
                      <div style={{ fontSize: 11.5, color: '#6b7580' }}>
                        {c.label} · {p.a.dist} v.a. hotel · ⏱ {p.a.dur}
                      </div>
                    </div>
                    <Score info={avgFor(p.a.title)} />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
