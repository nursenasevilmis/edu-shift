const TONE_STYLES = {
    blue: 'bg-[#dce8df] text-[#1f5c4b]',
    emerald: 'bg-[#dce8df] text-[#1f5c4b]',
    amber: 'bg-[#efe5d3] text-[#a05d25]',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-500',
}

export default function StatusBadge({ children, tone = 'slate' }) {
    return (
        <span className={'text-xs px-2.5 py-1 rounded font-medium ' + (TONE_STYLES[tone] || TONE_STYLES.slate)}>
            {children}
        </span>
    )
}