export default function PageCard({ title, description, action, children, className = '' }) {
  return (
    <section className={'surface p-5 md:p-6 ' + className}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--line)]">
          <div>
            {title && <h2 className="font-semibold text-[var(--ink)] text-base md:text-[17px]">{title}</h2>}
            {description && <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {!title && description && <p className="text-xs text-[var(--muted)] mb-4">{description}</p>}
      <div className={title || description ? 'mt-5' : ''}>{children}</div>
    </section>
  )
}
