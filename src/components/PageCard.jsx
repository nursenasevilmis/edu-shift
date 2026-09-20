export default function PageCard({ title, description, action, children, className = '' }) {
  return <section className={'bg-[#f4f1e9] border border-[#cbcfc8] rounded p-5 md:p-6 ' + className}>
    {(title || action) && <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#cbcfc8]"><div>{title && <h2 className="font-semibold text-[#202822] text-base md:text-[17px]">{title}</h2>}{description && <p className="text-xs text-[#68726b] mt-1 leading-relaxed">{description}</p>}</div>{action}</div>}
    {!title && description && <p className="text-xs text-[#68726b] mb-4">{description}</p>}
    <div className={title || description ? 'mt-5' : ''}>{children}</div>
  </section>
}
