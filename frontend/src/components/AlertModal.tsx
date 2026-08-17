// =============================================================================
// AlertModal — Pengganti alert()/confirm() bawaan browser, gaya sama seperti
// modal2 lain di app (dark, rounded, backdrop blur).
// Taruh di frontend/src/components/AlertModal.tsx
// =============================================================================

import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

export type AlertModalState = {
  title: string
  message: string
  variant?: 'error' | 'success' | 'info'
} | null

interface AlertModalProps {
  state: AlertModalState
  onClose: () => void
}

const VARIANT_STYLES = {
  error:   { icon: AlertTriangle, iconBg: 'bg-red-500/20', iconColor: 'text-red-400', border: 'border-red-500/40' },
  success: { icon: CheckCircle2,  iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400', border: 'border-emerald-500/40' },
  info:    { icon: AlertTriangle, iconBg: 'bg-indigo-500/20', iconColor: 'text-indigo-400', border: 'border-indigo-500/40' },
}

export default function AlertModal({ state, onClose }: AlertModalProps) {
  const variant = VARIANT_STYLES[state?.variant ?? 'error']
  const Icon = variant.icon

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-sm bg-slate-900/95 border ${variant.border} rounded-2xl p-5 shadow-2xl`}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${variant.iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${variant.iconColor}`} />
              </div>
              <div className="pt-1.5">
                <h3 className="text-sm font-black text-white">{state?.title}</h3>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-5 whitespace-pre-line">
              {state?.message}
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors"
            >
              OK
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
