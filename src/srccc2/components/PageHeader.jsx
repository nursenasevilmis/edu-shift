export default function PageHeader({ title, subtitle, action, eyebrow }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="section-kicker">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </header>
  )
}