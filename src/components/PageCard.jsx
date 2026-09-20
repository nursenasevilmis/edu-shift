import { Card } from '@heroui/react'

export default function PageCard({ title, description, action, children, className = '' }) {
  return (
    <Card className={'surface page-card ' + className}>
      {(title || action) && (
        <div className="page-card-head">
          <div>
            {title && <h2 className="page-card-title">{title}</h2>}
            {description && <p className="page-card-description">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {!title && description && <p className="page-card-description">{description}</p>}
      <div className={title || description ? 'page-card-body' : ''}>{children}</div>
    </Card>
  )
}