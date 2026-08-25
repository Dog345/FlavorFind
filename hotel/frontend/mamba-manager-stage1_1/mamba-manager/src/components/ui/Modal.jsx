import { useEffect } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function Modal({ open, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`relative w-full ${SIZES[size]} max-h-[90vh] overflow-y-auto scrollbar-thin rounded-2xl bg-white p-6 shadow-2xl`}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink-900">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 hover:bg-ink-900/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
