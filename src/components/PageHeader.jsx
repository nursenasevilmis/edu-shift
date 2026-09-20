export default function PageHeader({ title, subtitle, action, eyebrow }) {
  return <div className="flex items-end justify-between gap-4 mb-8 flex-wrap border-b border-[#cbcfc8] pb-5">
    <div>{eyebrow && <p className="text-[10px] uppercase tracking-[.16em] text-[#68726b] font-mono mb-2">{eyebrow}</p>}<h1 className="text-[28px] md:text-[34px] font-semibold text-[#202822] leading-tight">{title}</h1>{subtitle && <p className="text-[#68726b] text-sm mt-2 max-w-2xl leading-relaxed">{subtitle}</p>}</div>
    {action && <div>{action}</div>}
  </div>
}
