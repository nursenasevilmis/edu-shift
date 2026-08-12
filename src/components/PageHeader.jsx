export default function PageHeader({ title, subtitle, action }) {
    return (
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">{title}</h1>
                {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
                {action}
                <span className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Sistem çalışıyor
                </span>
            </div>
        </div>
    )
}