import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabase'

const CACHE_KEY = 'lissabon-wensen-v2'
const TABLE = 'wensen_ratings'

// { [naam]: { [activiteit-titel]: sterren } }
export type AllRatings = Record<string, Record<string, number>>

function loadCache(): AllRatings {
  try {
    const s = localStorage.getItem(CACHE_KEY)
    if (s) return JSON.parse(s)
  } catch {
    /* ignore */
  }
  return {}
}
function saveCache(r: AllRatings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(r))
  } catch {
    /* ignore */
  }
}

interface Row {
  person: string
  activity: string
  stars: number
}

/**
 * Gedeelde sterren. Leest bij het opstarten alle beoordelingen uit Supabase,
 * blijft live meeluisteren (realtime) en schrijft optimistisch weg. Zonder
 * Supabase-config valt alles terug op localStorage (per apparaat).
 */
export function useRatings() {
  const [all, setAll] = useState<AllRatings>(loadCache)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    const sb = supabase
    if (!isSupabaseConfigured || !sb) return
    let active = true

    sb.from(TABLE)
      .select('person,activity,stars')
      .then(({ data, error }) => {
        if (!active || error || !data) return
        const map: AllRatings = {}
        for (const row of data as Row[]) {
          ;(map[row.person] ??= {})[row.activity] = row.stars
        }
        setAll(map)
        saveCache(map)
        setSynced(true)
      })

    const channel = sb
      .channel('wensen-ratings')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (payload) => {
        setAll((prev) => {
          const next: AllRatings = {}
          for (const p in prev) next[p] = { ...prev[p] }
          if (payload.eventType === 'DELETE') {
            const o = payload.old as Partial<Row>
            if (o.person && next[o.person]) {
              if (o.activity) delete next[o.person][o.activity]
              if (Object.keys(next[o.person]).length === 0) delete next[o.person]
            }
          } else {
            const n = payload.new as Row
            if (n?.person) (next[n.person] ??= {})[n.activity] = n.stars
          }
          saveCache(next)
          return next
        })
      })
      .subscribe()

    return () => {
      active = false
      sb.removeChannel(channel)
    }
  }, [])

  function setRating(person: string, activity: string, stars: number) {
    setAll((prev) => {
      const next = { ...prev, [person]: { ...(prev[person] || {}), [activity]: stars } }
      saveCache(next)
      return next
    })
    const sb = supabase
    if (sb) {
      sb.from(TABLE)
        .upsert({ person, activity, stars }, { onConflict: 'person,activity' })
        .then(({ error }) => {
          if (error) console.warn('Kon sterren niet opslaan in Supabase:', error.message)
        })
    }
  }

  function resetPerson(person: string) {
    setAll((prev) => {
      const next = { ...prev }
      delete next[person]
      saveCache(next)
      return next
    })
    const sb = supabase
    if (sb) {
      sb.from(TABLE)
        .delete()
        .eq('person', person)
        .then(({ error }) => {
          if (error) console.warn('Kon sterren niet wissen in Supabase:', error.message)
        })
    }
  }

  return { all, setRating, resetPerson, synced, shared: isSupabaseConfigured }
}
