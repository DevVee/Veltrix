import type { LucideIcon } from 'lucide-react'

type Variant = 'view' | 'edit' | 'delete' | 'green' | 'gray' | 'purple'

const VARIANT_CLASS: Record<Variant, string> = {
  view:   'aib-view',
  edit:   'aib-edit',
  delete: 'aib-delete',
  green:  'aib-green',
  gray:   'aib-gray',
  purple: 'aib-purple',
}

interface ActionIconBtnProps {
  variant: Variant
  icon: LucideIcon
  onClick: (e: React.MouseEvent) => void
  title?: string
  disabled?: boolean
  size?: number
}

export function ActionIconBtn({
  variant, icon: Icon, onClick, title, disabled, size = 13,
}: ActionIconBtnProps) {
  return (
    <button
      type="button"
      className={`action-icon-btn ${VARIANT_CLASS[variant]}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      <Icon style={{ width: size, height: size }} />
    </button>
  )
}
