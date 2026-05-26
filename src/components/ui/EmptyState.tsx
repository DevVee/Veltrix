interface Props {
  icon: React.ElementType
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-6">
      <div
        className="w-10 h-10 flex items-center justify-center mb-3"
        style={{ background: '#F4F6F9', borderRadius: '8px' }}
      >
        <Icon className="w-5 h-5 text-gray-300" />
      </div>
      <h3 className="text-sm font-semibold text-gray-600">{title}</h3>
      {description && (
        <p className="text-[12px] text-gray-400 mt-1 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <button onClick={action.onClick} className="btn btn-primary mt-4">
          {action.label}
        </button>
      )}
    </div>
  )
}
