import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext()

const ICONS = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info }
const STYLES = {
    success: 'bg-white border-emerald-100 text-emerald-600',
    error: 'bg-white border-rose-100 text-rose-600',
    warning: 'bg-white border-amber-100 text-amber-600',
    info: 'bg-white border-blue-100 text-blue-600',
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random()
        setToasts((prev) => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, duration)
    }, [])

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const toast = {
        success: (msg, duration) => showToast(msg, 'success', duration),
        error: (msg, duration) => showToast(msg, 'error', duration),
        warning: (msg, duration) => showToast(msg, 'warning', duration),
        info: (msg, duration) => showToast(msg, 'info', duration),
    }

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full">
                {toasts.map((t) => {
                    const Icon = ICONS[t.type]
                    return (
                        <div
                            key={t.id}
                            className={
                                'flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-toast-in ' +
                                (STYLES[t.type] || STYLES.info)
                            }
                        >
                            <Icon size={18} className="shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-700 flex-1">{t.message}</p>
                            <button onClick={() => dismiss(t.id)} className="text-slate-300 hover:text-slate-500 shrink-0">
                                <X size={15} />
                            </button>
                        </div>
                    )
                })}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    return useContext(ToastContext)
}