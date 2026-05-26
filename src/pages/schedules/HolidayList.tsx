import { useState } from 'react'
import { Plus, Star, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { useData } from '../../hooks/useData'
import { apiGetHolidays } from '../../lib/db'
import type { Holiday, HolidayType } from '../../types'

const TYPE_CFG: Record<string, { label: string; bg: string; color: string }> = {
  regular:              { label:'Regular',            bg:'#FEF3C7', color:'#92400E' },
  'special-non-working':{ label:'Special Non-Working',bg:'#EFF6FF', color:'#1E40AF' },
  'special-working':    { label:'Special Working',    bg:'#F0FDF4', color:'#166534' },
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const DEFAULT_FORM = { name:'', date:'', type:'regular' as HolidayType, description:'' }

export function HolidayList() {
  const { data: holidays, loading, refetch } = useData(() => apiGetHolidays(), [])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())

  const filtered = (holidays ?? []).filter(h => h.date.startsWith(yearFilter))
  const years = [...new Set((holidays ?? []).map(h => h.date.slice(0,4)))].sort().reverse()

  // Group by month
  const byMonth: Record<number, Holiday[]> = {}
  filtered.forEach(h => {
    const m = new Date(h.date).getMonth()
    if (!byMonth[m]) byMonth[m] = []
    byMonth[m].push(h)
  })

  const save = async () => {
    if (!form.name.trim() || !form.date) return
    setSaving(true)
    try {
      const stored = JSON.parse(localStorage.getItem('tp_holidays') || '[]') as Holiday[]
      stored.push({
        id: `hol_${Date.now()}`,
        name: form.name,
        date: form.date,
        type: form.type,
        isNationwide: true,
        description: form.description || undefined,
      })
      stored.sort((a,b) => a.date.localeCompare(b.date))
      localStorage.setItem('tp_holidays', JSON.stringify(stored))
      setModal(false)
      setForm(DEFAULT_FORM)
      refetch()
    } finally { setSaving(false) }
  }

  const deleteHoliday = (h: Holiday) => {
    const stored = JSON.parse(localStorage.getItem('tp_holidays') || '[]') as Holiday[]
    localStorage.setItem('tp_holidays', JSON.stringify(stored.filter(x => x.id !== h.id)))
    setDeleteTarget(null); refetch()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Philippine Holidays"
        subtitle="Official holiday calendar for payroll computation"
        actions={[{ label:'Add Holiday', icon:Plus, onClick:() => setModal(true) }]}
      />

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(TYPE_CFG).map(([k,v]) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1"
            style={{ background: v.bg, color: v.color, border:`1px solid ${v.color}20` }}>
            <span className="w-2 h-2 inline-block" style={{ background: v.color }} />
            {v.label}
          </span>
        ))}
      </div>

      {/* Year filter */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Year:</span>
        <div className="flex gap-1">
          {(years.length ? years : [new Date().getFullYear().toString()]).map(y => (
            <button key={y} onClick={() => setYearFilter(y)}
              className="px-3 py-1 text-xs font-bold transition-colors"
              style={{
                background: yearFilter === y ? '#1565C0' : '#F3F4F6',
                color: yearFilter === y ? '#FFFFFF' : '#6B7280',
                border:'1px solid transparent',
              }}>
              {y}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} holidays</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !filtered.length ? (
        <div className="card">
          <EmptyState icon={Star} title="No holidays for this year" description="Add public holidays to include them in payroll computation."
            action={{ label:'Add Holiday', onClick:() => setModal(true) }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(byMonth)
            .sort(([a],[b]) => Number(a) - Number(b))
            .map(([m, hs]) => (
              <div key={m} className="card overflow-hidden">
                <div className="px-4 py-2.5 flex items-center justify-between"
                  style={{ background:'#F9FAFB', borderBottom:'1px solid #F3F4F6' }}>
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">{MONTHS[Number(m)]}</h3>
                  <span className="text-[10px] text-gray-400">{hs.length} holiday{hs.length > 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {hs.map(h => {
                    const cfg = TYPE_CFG[h.type] ?? TYPE_CFG.regular
                    const d = new Date(h.date + 'T00:00:00')
                    return (
                      <div key={h.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors group">
                        <div className="flex-shrink-0 w-10 text-center">
                          <p className="text-lg font-black text-gray-800 tabular-nums leading-none">{d.getDate()}</p>
                          <p className="text-[10px] text-gray-400">
                            {d.toLocaleDateString('en-PH',{weekday:'short'})}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{h.name}</p>
                          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold mt-0.5"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                        </div>
                        <button onClick={() => setDeleteTarget(h)}
                          className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Holiday"
        footer={
          <>
            <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={save} disabled={saving || !form.name.trim() || !form.date} className="btn-primary">
              {saving ? 'Saving…' : 'Add Holiday'}
            </button>
          </>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Holiday Name</label>
            <input className="input-base" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Araw ng Kagitingan" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Date</label>
              <input type="date" className="input-base" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Type</label>
              <select className="input-base" value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value as HolidayType}))}>
                <option value="regular">Regular Holiday</option>
                <option value="special-non-working">Special Non-Working</option>
                <option value="special-working">Special Working</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Description <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <input className="input-base" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Brief description…" />
          </div>
          <div className="p-3 text-xs" style={{ background:'#FFFBEB', border:'1px solid #FDE68A', color:'#92400E' }}>
            <strong>Note:</strong> Regular holidays are paid at 200% rate. Special non-working days at 130%. Special working days are treated as ordinary working days for payroll purposes.
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Holiday"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => deleteTarget && deleteHoliday(deleteTarget)}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">
              Remove
            </button>
          </>
        }>
        <p className="text-sm text-gray-700">Remove <strong>{deleteTarget?.name}</strong> ({deleteTarget?.date}) from the holiday calendar? This will affect future payroll computations.</p>
      </Modal>
    </div>
  )
}
