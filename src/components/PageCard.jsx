import { Card } from '@heroui/react'

export default function PageCard({ title, description, action, children, className = '' }) {
    return (
        <Card className={'border-0 shadow-soft rounded-2xl bg-white p-6 ' + className}>
            {(title || action) && (
                <div className="flex items-center justify-between mb-1">
                    {title && <Card.Title className="font-semibold text-slate-700 text-base">{title}</Card.Title>}
                    {action}
                </div>
            )}
            {description && <Card.Description className="text-xs text-slate-400 mb-4">{description}</Card.Description>}
            <Card.Content className="p-0">{children}</Card.Content>
        </Card>
    )
}