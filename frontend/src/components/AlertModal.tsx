// =============================================================================
// AlertModal — Pengganti alert()/confirm() bawaan browser, gaya sama seperti
// modal2 lain di app (dark, rounded, backdrop blur).
// Supports two modes:
//   • Simple alert  → { title, message, variant? }
//   • Confirm dialog → { type:'confirm', title, message, confirmLabel?, cancelLabel?, onConfirm, onCancel? }
// =============================================================================

import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

type AlertOnlyState = {
  type?: 'alert'
  title: string
  message: string
  variant?: 'error' | 'success' | 'info'
}

type ConfirmState = {
  type: 'confirm'
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
}

export type AlertModalState = AlertOnlyState | ConfirmState | null

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
  const isConfirm = state?.type === 'confirm'
  const variant = VARIANT_STYLES[(state as AlertOnlyState)?.variant ?? 'error']
  const Icon = variant.icon

  const handleConfirm = () => {
    if (isConfirm) (state as ConfirmState).onConfirm()
  }
  const handleCancel = () => {
    if (isConfirm) (state as ConfirmState).onCancel?.()
    onClose()
  }

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={isConfirm ? undefined : onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-sm bg-slate-900/95 border ${isConfirm ? 'border-amber-500/40' : variant.border} rounded-2xl p-5 shadow-2xl`}
          >
            {!isConfirm && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${isConfirm ? 'bg-amber-500/20' : variant.iconBg} flex items-center justify-center shrink-0`}>
                {isConfirm
                  ? <AlertTriangle className="w-5 h-5 text-amber-400" />
                  : <Icon className={`w-5 h-5 ${variant.iconColor}`} />
                }
              </div>
              <div className="pt-1.5">
                <h3 className="text-sm font-black text-white">{state?.title}</h3>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-5 whitespace-pre-line">
              {state?.message}
            </p>

            {isConfirm ? (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-colors"
                >
                  {(state as ConfirmState).cancelLabel ?? 'Batal'}
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition-colors"
                >
                  {(state as ConfirmState).confirmLabel ?? 'Konfirmasi'}
                </button>
              </div>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors"
              >
                OK
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

