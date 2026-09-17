import { useId, type InputHTMLAttributes } from 'react'

/** Labelled input with a generated id so the label is announced by screen readers. */
export function Field({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...input} />
    </div>
  )
}
