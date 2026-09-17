import { useEffect, useState, type ReactNode } from 'react'

/** Two-tap destructive button: first tap arms it, second tap (within 3s) fires. */
export function ConfirmButton({
  children,
  confirmLabel = 'Tap again to confirm',
  className = '',
  onConfirm,
}: {
  children: ReactNode
  confirmLabel?: string
  className?: string
  onConfirm: () => void
}) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])

  return (
    <button
      className={`${className} ${armed ? 'btn-danger-solid' : ''}`}
      onClick={() => {
        if (armed) {
          setArmed(false)
          onConfirm()
        } else {
          setArmed(true)
        }
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  )
}
