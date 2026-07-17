import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import { DAY_META, FLIGHT_SEED, type CatKey, type Day, type Item } from './data'

const TABLE = 'planning_items'
const CACHE = 'lissabon-planning-rows-v1'
export const SHORT_DAY = -1

export interface PlanRow {
  id: string
  day_idx: number // 0..7 = reisdag, -1 = nog in te plannen
  pos: number
  title: string
  cat: CatKey
  dur: string
  note: string
  done: boolean
}

export interface ShortItem {
  id: string
  title: string
  cat: CatKey
  dur: string
  note: string
}

const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

function loadCache(): PlanRow[] {
  try {
    const s = localStorage.getItem(CACHE)
    if (s) return JSON.parse(s)
  } catch {
    /* ignore */
  }
  return []
}
function saveCache(rows: PlanRow[]) {
  try {
    localStorage.setItem(CACHE, JSON.stringify(rows))
  } catch {
    /* ignore */
  }
}

// row -> Item voor weergave in de planning (duur vooraan in de notitie)
function toItem(r: PlanRow): Item {
  const note = r.dur ? (r.note ? r.dur + ' · ' + r.note : r.dur) : r.note
  return { id: r.id, title: r.title, cat: r.cat, note, done: r.done }
}

export function usePlanning() {
  const [rows, setRowsState] = useState<PlanRow[]>(loadCache)
  const rowsRef = useRef(rows)
  rowsRef.current = rows
  const seeded = useRef(false)

  const setRows = useCallback((next: PlanRow[]) => {
    saveCache(next)
    setRowsState(next)
  }, [])

  useEffect(() => {
    const sb = supabase
    if (!sb) {
      // fallback zonder Supabase: alleen op dit apparaat, vluchten eenmalig seeden
      if (rowsRef.current.length === 0) setRows(FLIGHT_SEED.map((f) => ({ ...f })))
      return
    }
    let active = true

    const pull = () =>
      sb
        .from(TABLE)
        .select('*')
        .then(({ data, error }) => {
          if (!active || error || !data) return
          const rs = data as PlanRow[]
          setRows(rs)
          if (rs.length === 0 && !seeded.current) {
            seeded.current = true
            sb.from(TABLE)
              .upsert(FLIGHT_SEED, { onConflict: 'id' })
              .then(({ error: e }) => {
                if (e) console.warn('Kon vluchten niet seeden:', e.message)
              })
          }
        })

    pull()
    const ch = sb
      .channel('planning-items')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => pull())
      .subscribe()

    return () => {
      active = false
      sb.removeChannel(ch)
    }
  }, [setRows])

  // ---- schrijfacties (optimistisch + Supabase) ----
  function upsertRemote(changed: PlanRow[]) {
    const sb = supabase
    if (sb && changed.length)
      sb.from(TABLE)
        .upsert(changed, { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.warn('Planning niet opgeslagen:', error.message)
        })
  }
  function deleteRemote(id: string) {
    const sb = supabase
    if (sb)
      sb.from(TABLE)
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('Planning-item niet verwijderd:', error.message)
        })
  }

  function nextPos(dayIdx: number): number {
    const inDay = rowsRef.current.filter((r) => r.day_idx === dayIdx)
    return inDay.length ? Math.max(...inDay.map((r) => r.pos)) + 1 : 0
  }

  function addItem(dayIdx: number, data: { title: string; cat: CatKey; dur?: string; note?: string }) {
    const row: PlanRow = {
      id: newId(),
      day_idx: dayIdx,
      pos: nextPos(dayIdx),
      title: data.title,
      cat: data.cat,
      dur: data.dur || '',
      note: data.note || '',
      done: false,
    }
    setRows([...rowsRef.current, row])
    upsertRemote([row])
  }

  function removeItem(id: string) {
    setRows(rowsRef.current.filter((r) => r.id !== id))
    deleteRemote(id)
  }

  function toggleDone(id: string) {
    let changed: PlanRow | null = null
    const next = rowsRef.current.map((r) => {
      if (r.id !== id) return r
      changed = { ...r, done: !r.done }
      return changed
    })
    setRows(next)
    if (changed) upsertRemote([changed])
  }

  function reorder(dayIdx: number, from: number, to: number) {
    const inDay = rowsRef.current.filter((r) => r.day_idx === dayIdx).sort((a, b) => a.pos - b.pos)
    if (to < 0 || to >= inDay.length || from < 0 || from >= inDay.length || from === to) return
    const [m] = inDay.splice(from, 1)
    inDay.splice(to, 0, m)
    const renumbered = inDay.map((r, i) => ({ ...r, pos: i }))
    const others = rowsRef.current.filter((r) => r.day_idx !== dayIdx)
    setRows([...others, ...renumbered])
    upsertRemote(renumbered)
  }

  // shortlist (-1) -> een dag
  function moveToDay(id: string, dayIdx: number) {
    const row = rowsRef.current.find((r) => r.id === id)
    if (!row) return
    const moved: PlanRow = { ...row, day_idx: dayIdx, pos: nextPos(dayIdx) }
    setRows(rowsRef.current.map((r) => (r.id === id ? moved : r)))
    upsertRemote([moved])
  }

  // In-te-plannen aan/uit op titel (vanuit Wensen)
  function toggleShort(a: { title: string; cat: CatKey; dur: string; note: string }) {
    const existing = rowsRef.current.find((r) => r.day_idx === SHORT_DAY && r.title === a.title)
    if (existing) {
      removeItem(existing.id)
      return false
    }
    addItem(SHORT_DAY, { title: a.title, cat: a.cat, dur: a.dur, note: a.note })
    return true
  }

  const days: Day[] = DAY_META.map((m, i) => ({
    ...m,
    items: rows
      .filter((r) => r.day_idx === i)
      .sort((a, b) => a.pos - b.pos)
      .map(toItem),
  }))
  const shortlist: ShortItem[] = rows
    .filter((r) => r.day_idx === SHORT_DAY)
    .sort((a, b) => a.pos - b.pos)
    .map((r) => ({ id: r.id, title: r.title, cat: r.cat, dur: r.dur, note: r.note }))

  return { days, shortlist, addItem, removeItem, toggleDone, reorder, moveToDay, toggleShort }
}
