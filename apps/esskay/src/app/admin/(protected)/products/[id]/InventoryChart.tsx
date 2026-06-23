'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/format'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface InventoryEvent {
  id: string
  event_date: string
  qty_on_hand_delta: number
  note: string | null
}

interface ChartPoint {
  date: string
  qty: number
}

export function InventoryChart({ productId }: { productId: string }) {
  const [events, setEvents] = useState<InventoryEvent[] | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient()

    supabase
      .from('inventory_events')
      .select('id, event_date, qty_on_hand_delta, note')
      .eq('product_id', productId)
      .order('event_date', { ascending: true })
      .then(({ data }) => {
        setEvents(data ?? [])
        requestAnimationFrame(() => setVisible(true))
      })

    const channel = supabase
      .channel(`inventory:${productId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inventory_events',
          filter: `product_id=eq.${productId}`,
        },
        (payload) => {
          setEvents((prev) => {
            const next = [...(prev ?? []), payload.new as InventoryEvent]
            return next.sort((a, b) => a.event_date.localeCompare(b.event_date))
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [productId])

  if (events === null) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-sm text-site-muted">Loading&hellip;</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-sm text-site-muted">No inventory history yet</p>
      </div>
    )
  }

  const data: ChartPoint[] = events.reduce<ChartPoint[]>((acc, e) => {
    const qty = (acc[acc.length - 1]?.qty ?? 0) + e.qty_on_hand_delta
    acc.push({ date: formatDate(e.event_date), qty })
    return acc
  }, [])

  return (
    <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 300ms ease' }}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--site-border)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--site-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--site-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={32}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--site-bg-alt)',
              border: '1px solid var(--site-border)',
              borderRadius: 'var(--site-radius)',
              fontSize: '12px',
              color: 'var(--site-text)',
            }}
            formatter={(value) => [value ?? 0, 'Qty on hand']}
          />
          <Line
            type="monotone"
            dataKey="qty"
            stroke="var(--site-accent-azure-dark)"
            strokeWidth={2}
            dot={{ fill: 'var(--site-accent-navy)', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: 'var(--site-accent-azure-dark)' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
