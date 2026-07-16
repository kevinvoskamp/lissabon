import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

/**
 * Een lijst die in Supabase staat en met iedereen wordt gedeeld (met realtime
 * updates). Zonder Supabase-config werkt alles door op localStorage.
 */
export function useSharedList<T extends { id: string }>(table: string, cacheKey: string) {
  const [items, setItems] = useState<T[]>(() => {
    try {
      const s = localStorage.getItem(cacheKey)
      if (s) return JSON.parse(s)
    } catch {
      /* ignore */
    }
    return []
  })

  const save = useCallback(
    (next: T[]) => {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      setItems(next)
    },
    [cacheKey],
  )

  useEffect(() => {
    const sb = supabase
    if (!sb) return
    let active = true

    const pull = () =>
      sb
        .from(table)
        .select('*')
        .order('created_at', { ascending: true })
        .then(({ data, error }) => {
          if (!active || error || !data) return
          save(data as T[])
        })

    pull()
    const ch = sb
      .channel('list-' + table)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => pull())
      .subscribe()

    return () => {
      active = false
      sb.removeChannel(ch)
    }
  }, [table, save])

  function add(item: T) {
    save([...items, item])
    const sb = supabase
    if (sb)
      sb.from(table)
        .insert(item)
        .then(({ error }) => {
          if (error) console.warn(`Kon niet opslaan in ${table}:`, error.message)
        })
  }

  function remove(id: string) {
    save(items.filter((i) => i.id !== id))
    const sb = supabase
    if (sb)
      sb.from(table)
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn(`Kon niet verwijderen uit ${table}:`, error.message)
        })
  }

  return { items, add, remove }
}

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
