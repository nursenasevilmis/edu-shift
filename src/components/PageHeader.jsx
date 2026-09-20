import { ArrowUpRight } from 'lucide-react'

export default function PageHeader({ title, subtitle, action, eyebrow = 'Okul operasyonu' }) {
  return <div className="flex items-end justify-between gap-4 mb-7 flex-wrap">
    <div>
      <p className="text-[11px] uppercase tracking-[.16em] text-teal-700 font-bold mb-2">{eyebrow}</p>
      <h1 className="text-[28px] md:text-[34px] font-bold text-slate-900 leading-tight">{title}</h1>
      {subtitle && <p className="text-slate-500 text-sm mt-2 max-w-2xl leading-relaxed">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-3">
      {action}
      <span className="hidden lg:flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Canlı veri <ArrowUpRight size={13} className="text-slate-300" /></span>
    </div>
  </div>
}
