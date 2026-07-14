import { useEffect, useState } from 'react'

export interface DailyForecast {
  date: string
  wd: string
  dm: string
  max: number
  min: number
  code: number
  icon: string
  label: string
}

export interface Weather {
  current: { temp: number; code: number; icon: string; label: string }
  daily: DailyForecast[]
}

// Lissabon
const LAT = 38.7223
const LON = -9.1393

// WMO weather codes → Dutch label + emoji
function describe(code: number): { icon: string; label: string } {
  const map: Record<number, { icon: string; label: string }> = {
    0: { icon: '☀️', label: 'Onbewolkt' },
    1: { icon: '🌤️', label: 'Overwegend zonnig' },
    2: { icon: '⛅', label: 'Half bewolkt' },
    3: { icon: '☁️', label: 'Bewolkt' },
    45: { icon: '🌫️', label: 'Mist' },
    48: { icon: '🌫️', label: 'Aanvriezende mist' },
    51: { icon: '🌦️', label: 'Lichte motregen' },
    53: { icon: '🌦️', label: 'Motregen' },
    55: { icon: '🌦️', label: 'Dichte motregen' },
    61: { icon: '🌧️', label: 'Lichte regen' },
    63: { icon: '🌧️', label: 'Regen' },
    65: { icon: '🌧️', label: 'Zware regen' },
    66: { icon: '🌧️', label: 'IJzel' },
    67: { icon: '🌧️', label: 'Zware ijzel' },
    71: { icon: '🌨️', label: 'Lichte sneeuw' },
    73: { icon: '🌨️', label: 'Sneeuw' },
    75: { icon: '❄️', label: 'Zware sneeuw' },
    80: { icon: '🌦️', label: 'Lichte buien' },
    81: { icon: '🌦️', label: 'Buien' },
    82: { icon: '⛈️', label: 'Zware buien' },
    95: { icon: '⛈️', label: 'Onweer' },
    96: { icon: '⛈️', label: 'Onweer met hagel' },
    99: { icon: '⛈️', label: 'Zwaar onweer' },
  }
  return map[code] ?? { icon: '🌡️', label: 'Onbekend' }
}

const WD = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']

export function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=Europe%2FLisbon&forecast_days=7`

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('http ' + r.status)
        return r.json()
      })
      .then((d) => {
        if (cancelled) return
        const cur = describe(d.current.weather_code)
        const daily: DailyForecast[] = d.daily.time.map((iso: string, i: number) => {
          const date = new Date(iso + 'T00:00:00')
          const desc = describe(d.daily.weather_code[i])
          return {
            date: iso,
            wd: WD[date.getDay()],
            dm: date.getDate() + '/' + (date.getMonth() + 1),
            max: Math.round(d.daily.temperature_2m_max[i]),
            min: Math.round(d.daily.temperature_2m_min[i]),
            code: d.daily.weather_code[i],
            icon: desc.icon,
            label: desc.label,
          }
        })
        setWeather({
          current: {
            temp: Math.round(d.current.temperature_2m),
            code: d.current.weather_code,
            icon: cur.icon,
            label: cur.label,
          },
          daily,
        })
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { weather, error, loading }
}
