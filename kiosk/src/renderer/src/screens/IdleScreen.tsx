import { motion } from 'framer-motion'
import { Fingerprint, CreditCard, RefreshCw } from 'lucide-react'
import { Clock }          from '../components/Clock'
import { SyncStatus }     from '../components/SyncStatus'
import { RecentCheckins } from '../components/RecentCheckins'

interface IdleScreenProps {
  onPINMode:  () => void
  onRFIDMode: () => void
}

export function IdleScreen({ onPINMode, onRFIDMode }: IdleScreenProps) {
  const handleRefresh = async () => {
    try { await window.kiosk.refreshEmployees() } catch { /* ignore */ }
  }

  return (
    <motion.div
      key="idle"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="h-screen w-screen flex overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 20% 50%, #1e1b4b 0%, #0f0f23 60%, #0F172A 100%)',
      }}
    >
      {/* ── Left panel: clock + CTA ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 px-12">

        {/* Logo + brand */}
        <div className="flex flex-col items-center gap-3">
          <img src="/Veltrix.png" alt="Veltrix" className="h-12 opacity-90" onError={e => (e.currentTarget.style.display='none')} />
          <p className="text-slate-400 text-sm tracking-widest uppercase font-medium">Attendance Kiosk</p>
        </div>

        {/* Clock */}
        <Clock />

        {/* Tap prompt */}
        <motion.p
          className="text-slate-400 text-base font-medium tracking-wide"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          Tap a button or scan your card to check in
        </motion.p>

        {/* Action buttons */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onPINMode}
            className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors border border-indigo-400/30 shadow-lg shadow-indigo-900/50"
          >
            <Fingerprint size={32} strokeWidth={1.5} />
            Enter PIN
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRFIDMode}
            className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl glass hover:bg-white/12 text-white font-semibold text-sm transition-colors shadow-lg"
          >
            <CreditCard size={32} strokeWidth={1.5} />
            Scan Card
          </motion.button>
        </div>

        {/* Sync status */}
        <SyncStatus />
      </div>

      {/* ── Right panel: recent check-ins ───────────────────────────────── */}
      <div className="w-80 flex flex-col border-l border-white/8 bg-black/20">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Recent</h2>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
            title="Refresh employee list"
          >
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden px-3 py-3">
          <RecentCheckins />
        </div>
      </div>
    </motion.div>
  )
}
