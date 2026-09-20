export default function PageHeader({ title, subtitle, action, eyebrow = 'Okul operasyonu' }) {
  return (
    <header className="flex items-end justify-between gap-5 mb-7 flex-wrap border-b border-[var(--line)] pb-5">
      <div>
        {eyebrow && <p className="section-kicker mb-2">{eyebrow}</p>}
        <h1 className="text-[30px] md:text-[38px] font-semibold text-[var(--ink)] leading-[.98]">{title}</h1>
        {subtitle && <p className="text-[var(--muted)] text-sm mt-3 max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </header>
  )
}
