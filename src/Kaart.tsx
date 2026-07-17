import { ACTIVITIES, ACTIVITY_GEO, CATS, HOTEL_GEO } from './data'

// Alle activiteiten met hun ligging, genummerd.
const POINTS = ACTIVITIES.map((a, i) => ({ i, a, geo: ACTIVITY_GEO[i], n: i + 1 }))
const CITY = POINTS.filter((p) => !p.geo.dayTrip)
const TRIPS = POINTS.filter((p) => p.geo.dayTrip)

// Projectie van lat/lng naar de SVG, op basis van de stad-punten (+ hotel).
const W = 360
const H = 244
const PAD = 24
const lngs = [...CITY.map((p) => p.geo.lng), HOTEL_GEO.lng]
const lats = [...CITY.map((p) => p.geo.lat), HOTEL_GEO.lat]
const lngMin = Math.min(...lngs)
const lngMax = Math.max(...lngs)
const latMin = Math.min(...lats)
const latMax = Math.max(...lats)
function project(lat: number, lng: number) {
  const x = PAD + ((lng - lngMin) / (lngMax - lngMin)) * (W - 2 * PAD)
  const y = PAD + ((latMax - lat) / (latMax - latMin)) * (H - 2 * PAD)
  return { x, y }
}

// volgorde van de gebieden in de lijst
const ZONE_ORDER = ['Baixa & Alfama', 'Cais do Sodré', 'Centrum-noord', 'Belém & LX', 'Parque das Nações', 'Vlak bij het hotel', 'Dagtrips']

export default function Kaart() {
  const hotel = project(HOTEL_GEO.lat, HOTEL_GEO.lng)

  // groepeer per gebied voor de lijst eronder
  const zones = ZONE_ORDER.map((z) => ({ zone: z, pts: POINTS.filter((p) => p.geo.zone === z) })).filter((g) => g.pts.length)

  return (
    <div>
      <div style={{ padding: '52px 20px 10px 20px' }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: '-.5px' }}>Kaart</div>
        <div style={{ width: 36, height: 3, background: '#3d7ea6', borderRadius: 2, marginTop: 8, marginBottom: 8 }} />
        <div style={{ fontSize: 13, color: '#6b7580' }}>
          Waar alles ligt — dingen dicht bij elkaar zijn goed op één dag te combineren.
        </div>
      </div>

      <div style={{ padding: '4px 16px 8px' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 12, boxShadow: '0 1px 3px rgba(31,42,48,.06)' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 10, background: '#eef2ee' }}>
            {/* de Taag onderaan */}
            <rect x="0" y={H - 34} width={W} height="34" fill="#cfe0ea" />
            <text x={W - 8} y={H - 12} textAnchor="end" fontSize="9" fill="#6b8ba0" fontStyle="italic">
              Rio Tejo
            </text>

            {/* hotel */}
            <g>
              <circle cx={hotel.x} cy={hotel.y} r="7" fill="#274b6b" />
              <text x={hotel.x} y={hotel.y + 3} textAnchor="middle" fontSize="9" fill="#fff">
                ★
              </text>
              <text x={hotel.x} y={hotel.y - 11} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#274b6b">
                Hotel
              </text>
            </g>

            {/* activiteiten in de stad */}
            {CITY.map((p) => {
              const { x, y } = project(p.geo.lat, p.geo.lng)
              const c = CATS[p.a.cat] || CATS.cultuur
              return (
                <g key={p.i}>
                  <circle cx={x} cy={y} r="9" fill={c.color} stroke="#fff" strokeWidth="1.5" />
                  <text x={x} y={y + 3.3} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff">
                    {p.n}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* dagtrips als losse chips (te ver voor de stadskaart) */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {TRIPS.map((p) => (
              <span
                key={p.i}
                style={{ fontSize: 11.5, fontWeight: 600, background: '#f0ece2', color: '#6b7580', padding: '5px 10px', borderRadius: 999 }}
              >
                {p.n}. {p.a.title.split(' (')[0]} · {p.a.dist}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* per gebied — dit laat zien wat te combineren is */}
      <div style={{ padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {zones.map((g) => (
          <div key={g.zone} style={{ background: '#fff', borderRadius: 14, padding: 14, boxShadow: '0 1px 2px rgba(31,42,48,.05)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
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
                  <div key={p.i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
