interface Action {
  label: string
  icon?: React.ElementType
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}

interface Props {
  title: string
  subtitle?: string
  actions?: Action[]
  breadcrumb?: string
  meta?: React.ReactNode   // extra right-side metadata
}

export function PageHeader({ title, subtitle, actions, breadcrumb, meta }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
      <div className="min-w-0">
        {breadcrumb && (
          <p className="text-[11px] text-gray-400 font-medium mb-0.5 uppercase tracking-wide">
            {breadcrumb}
          </p>
        )}
        <h1 className="text-[17px] font-bold text-gray-900 leading-tight tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-[12px] text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {meta}
        {actions?.map(a => {
          const Icon = a.icon
          const cls  = a.variant === 'secondary' ? 'btn-secondary btn'
                     : a.variant === 'danger'    ? 'btn-danger btn'
                     : 'btn-primary btn'
          return (
            <button key={a.label} onClick={a.onClick} className={cls}>
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {a.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
