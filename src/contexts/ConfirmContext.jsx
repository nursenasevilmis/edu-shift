/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { AlertTriangle } from '../components/UiMarks'

const ConfirmContext = createContext()

export function ConfirmProvider({ children }) {
    const [state, setState] = useState(null)
    const resolveRef = useRef(null)

    const confirm = useCallback((options) => {
        const opts = typeof options === 'string' ? { message: options } : options
        setState(opts)
        return new Promise((resolve) => {
            resolveRef.current = resolve
        })
    }, [])

    function handleClose(result) {
        setState(null)
        if (resolveRef.current) {
            resolveRef.current(result)
            resolveRef.current = null
        }
    }

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {state && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40" onClick={() => handleClose(false)}></div>
                    <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-toast-in">
                        <div className="w-11 h-11 rounded bg-[#f1f3f6] flex items-center justify-center text-[#121a2a] mb-4">
                            <AlertTriangle size={20} />
                        </div>
                        {state.title && <h3 className="font-semibold text-slate-800 mb-1.5">{state.title}</h3>}
                        <p className="text-sm text-slate-500 mb-6">{state.message}</p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => handleClose(false)}
                                className="px-4 py-2 rounded text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors duration-150"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={() => handleClose(true)}
                                className="px-4 py-2 rounded text-sm font-bold text-white bg-[#121a2a] hover:bg-[#273348] transition-colors duration-150"
                            >
                                {state.confirmLabel || 'Sil'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    )
}

export function useConfirm() {
    return useContext(ConfirmContext)
}