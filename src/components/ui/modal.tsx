import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from './button'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  children: React.ReactNode
  footer?: {
    cancelLabel?: string
    saveLabel?: string
    onSave: () => void | Promise<void>
    onCancel?: () => void | Promise<void>
    saveDisabled?: boolean
    showCancel?: boolean
  }
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  size = 'lg',
  children,
  footer,
}: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Modal container — uses semantic CSS variables for both themes */}
      <div
        className={`relative w-full rounded-sm shadow-lg flex flex-col max-h-[90vh] ${SIZE_CLASSES[size]}`}
        style={{
          backgroundColor: 'var(--modal-bg)',
          borderColor: 'var(--modal-border)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header — highlighted background */}
        <div
          className="flex items-start justify-between px-6 py-4 border-b rounded-t-sm"
          style={{
            backgroundColor: 'var(--modal-header-bg)',
            borderColor: 'var(--modal-border)',
          }}
        >
          <div className="flex-1 min-w-0 pr-8">
            <h2
              id="modal-title"
              className="text-lg font-serif font-medium"
              style={{ color: 'var(--modal-text)' }}
            >
              {title}
            </h2>
            {description && (
              <p
                className="mt-1 text-sm"
                style={{ color: 'var(--modal-text-muted)' }}
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            className="absolute right-4 top-4 p-1 rounded-sm transition-colors focus:outline-none"
            style={{ color: 'var(--modal-text-muted)' }}
            onClick={() => onOpenChange(false)}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="flex items-center justify-between px-6 py-4 border-t rounded-b-sm"
            style={{
              backgroundColor: 'var(--modal-bg)',
              borderColor: 'var(--modal-border)',
            }}
          >
            <div>
              {footer.showCancel !== false && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    footer.onCancel?.()
                    onOpenChange(false)
                  }}
                >
                  {footer.cancelLabel || 'Cancelar'}
                </Button>
              )}
            </div>
            <Button
              type="button"
              onClick={footer.onSave}
              disabled={footer.saveDisabled}
              className="bg-[#AD7B3B] hover:bg-[#AD7B3B]/90 text-white"
            >
              {footer.saveLabel || 'Salvar'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
