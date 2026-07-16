import { useState } from 'react'

export const AUTH_KEY = 'lissabon-auth'
// The one account for this app. Wachtwoord is altijd "vakantie".
const PASSWORD = 'vakantie'
const DEFAULT_NAME = 'Familie Voskamp'
// Snelkeuze — iedereen logt in onder z'n eigen naam, zodat sterren per persoon worden bewaard
const FAMILY = ['Kevin', 'Danielle', 'Maura', 'Lieke']

export interface Auth {
  name: string
}

export function loadAuth(): Auth | null {
  try {
    const s = localStorage.getItem(AUTH_KEY)
    if (s) return JSON.parse(s)
  } catch {
    /* ignore */
  }
  return null
}

export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_KEY)
  } catch {
    /* ignore */
  }
}

export default function Login({ onLogin }: { onLogin: (auth: Auth) => void }) {
  const [name, setName] = useState(DEFAULT_NAME)
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pw !== PASSWORD) {
      setError('Onjuist wachtwoord. Hint: waar gaan we heen doen? 😉')
      return
    }
    const auth: Auth = { name: name.trim() || DEFAULT_NAME }
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
    } catch {
      /* ignore */
    }
    onLogin(auth)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        background: 'transparent',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          minHeight: '100vh',
          background: '#f4efe6',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 0 60px rgba(31,42,48,.12)',
        }}
      >
        <div
          className="azulejo"
          style={{ position: 'relative', padding: '72px 24px 40px', color: '#f4efe6', overflow: 'hidden' }}
        >
          <div style={{ marginBottom: 12 }}>
            <span className="flag-pt" aria-label="Portugese vlag" role="img" />
          </div>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 44, lineHeight: 0.95, letterSpacing: -1 }}>
            Lissabon
          </div>
          <div style={{ width: 46, height: 3, background: '#e0a83e', borderRadius: 2, marginTop: 14 }} />
          <div style={{ marginTop: 14, fontSize: 14, color: '#f6d9a8', fontWeight: 600 }}>23 – 30 juli 2026</div>
        </div>
        <div className="tile-strip" />

        <form onSubmit={submit} style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: '-.5px' }}>
              Welkom terug
            </div>
            <div style={{ fontSize: 13.5, color: '#6b7580', marginTop: 6 }}>Log in om jullie reisplanner te openen.</div>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7580', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Naam
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 2 }}>
              {FAMILY.map((f) => {
                const sel = name === f
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setName(f)}
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: '7px 12px',
                      borderRadius: 999,
                      background: sel ? '#274b6b' : '#f0ece2',
                      color: sel ? '#f4efe6' : '#6b7580',
                    }}
                  >
                    {f}
                  </button>
                )
              })}
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Je naam"
              autoComplete="username"
              style={{
                border: '1px solid #e4dccd',
                borderRadius: 12,
                padding: '13px 14px',
                fontSize: 15,
                fontFamily: 'inherit',
                background: '#fff',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7580', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Wachtwoord
            </span>
            <input
              type="password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value)
                if (error) setError('')
              }}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{
                border: '1px solid ' + (error ? '#c15b4a' : '#e4dccd'),
                borderRadius: 12,
                padding: '13px 14px',
                fontSize: 15,
                fontFamily: 'inherit',
                background: '#fff',
              }}
            />
          </label>

          {error && <div style={{ fontSize: 13, color: '#c15b4a', fontWeight: 600, marginTop: -6 }}>{error}</div>}

          <button
            type="submit"
            style={{
              border: 'none',
              cursor: 'pointer',
              background: '#274b6b',
              color: '#f4efe6',
              fontFamily: "'Bricolage Grotesque',sans-serif",
              fontWeight: 600,
              fontSize: 15,
              padding: 15,
              borderRadius: 14,
              marginTop: 4,
            }}
          >
            Inloggen →
          </button>
        </form>
      </div>
    </div>
  )
}
