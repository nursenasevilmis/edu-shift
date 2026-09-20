export default function PageCard({ title, description, action, children, className = '' }) {
  return <section className={'bg-white border border-slate-200/70 shadow-soft rounded-[22px] p-5 md:p-6 ' + className}>
    {(title || action) && <div className="flex items-start justify-between gap-4 mb-1"><div>{title && <h2 className="font-bold text-slate-800 text-base md:text-[17px]">{title}</h2>}{description && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{description}</p>}</div>{action}</div>}
    {!title && description && <p className="text-xs text-slate-400 mb-4">{description}</p>}
    <div className={title || description ? 'mt-4' : ''}>{children}</div>
  </section>
}
