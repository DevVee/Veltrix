import { useState, useEffect } from 'react'
import { LogIn, LogOut, Users } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

type Checkin = {
  id: string
  employee_id: string
  full_name: string
  department: string | null
  type: 'time-in' | 'time-out'
  timestamp: string
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)  return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-sky-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
]

function avatarColor(id: string): string {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function RecentCheckins() {
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      if (cancelled) return
      try {
        const data = await window.kiosk.recentCheckins() as Checkin[]
        if (!cancelled) setCheckins(data)
      } catch { /* ignore */ }
      if (!cancelled) setTimeout(fetch, 8000)
    }

    fetch()

    // Re-render every 30 s to update "time ago"
    const tick = setInterval(() => setTick(t => t + 1), 30_000)
    return () => { cancelled = true; clearInterval(tick) }
  }, [])

  if (!checkins.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-slate-600">
        <Users size={28} />
        <p className="text-sm">No check-ins yet today</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {checkins.map(c => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/8"
          >
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${avatarColor(c.employee_id)}`}>
              {initials(c.full_name)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{c.full_name}</p>
              <p className="text-xs text-slate-400 truncate">{c.department ?? 'No department'}</p>
            </div>

            {/* Type + time */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                c.type === 'time-in'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {c.type === 'time-in' ? <LogIn size={10} /> : <LogOut size={10} />}
                {c.type === 'time-in' ? 'In' : 'Out'}
              </span>
              <span className="text-xs text-slate-500">{timeAgo(c.timestamp)}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
