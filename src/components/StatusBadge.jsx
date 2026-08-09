const TONE_STYLES = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-500',
}

export default function StatusBadge({ children, tone = 'slate' }) {
    return (
        <span className={'text-xs px-2.5 py-1 rounded-lg font-medium ' + (TONE_STYLES[tone] || TONE_STYLES.slate)}>
            {children}
        </span>
    )
}