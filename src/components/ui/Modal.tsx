import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
}

const WIDTHS = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }

export function Modal({ open, onClose, title, children, size = 'md', footer }: Props) {
  useEffect(() => {
    if (!open) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(17,19,24,0.55)' }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={`relative bg-white w-full ${WIDTHS[size]} flex flex-col max-h-[90vh] z-10 animate-slide-in`}
        style={{
          border: '1px solid #E2E5EB',
          borderRadius: '8px',
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.12), 0 2px 8px 0 rgba(0,0,0,0.06)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{ borderBottom: '1px solid #EEF0F4' }}
        >
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            style={{ borderRadius: '4px' }}
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div
            className="px-5 py-3.5 flex-shrink-0 flex items-center justify-end gap-2"
            style={{ borderTop: '1px solid #EEF0F4' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
