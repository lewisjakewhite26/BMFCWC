import { forwardRef, useCallback } from 'react'

interface ScoreInputProps {
  value: number | ''
  onChange: (value: number | '') => void
  onAdvance?: () => void
  disabled?: boolean
  awaiting?: boolean
  ariaLabel: string
}

export const ScoreInput = forwardRef<HTMLInputElement, ScoreInputProps>(function ScoreInput(
  { value, onChange, onAdvance, disabled = false, awaiting = false, ariaLabel },
  ref
) {
  const isEmpty = value === ''

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return

      if (e.key === 'Backspace') {
        if (value !== '') {
          e.preventDefault()
          onChange('')
        }
        return
      }

      if (!/^\d$/.test(e.key)) return

      e.preventDefault()
      const digit = parseInt(e.key, 10)

      if (value === '') {
        onChange(digit)
        onAdvance?.()
        return
      }

      const combined = parseInt(`${value}${e.key}`, 10)
      if (combined <= 99) {
        onChange(combined)
      }
    },
    [disabled, value, onChange, onAdvance]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '')
      if (val === '') {
        onChange('')
        return
      }

      const num = parseInt(val.slice(0, 2), 10)
      if (isNaN(num) || num > 99) return

      const prevStr = value === '' ? '' : String(value)
      const wasEmpty = prevStr === ''
      onChange(num)

      if (wasEmpty && val.length === 1) {
        onAdvance?.()
      }
    },
    [value, onChange, onAdvance]
  )

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      enterKeyHint="next"
      autoComplete="off"
      maxLength={2}
      value={value === '' ? '' : String(value)}
      disabled={disabled}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      className={`
        w-11 h-11 sm:w-16 sm:h-16 text-center text-xl sm:text-3xl font-mono font-bold rounded-xl sm:rounded-2xl
        transition-[background-color,border-color,box-shadow,opacity] duration-200 text-brand-navy touch-manipulation shrink-0
        focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20
        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
        ${disabled ? 'opacity-50 cursor-not-allowed text-gray-400 bg-gray-50 border-2 border-gray-200' : ''}
        ${!disabled && awaiting && isEmpty
          ? 'bg-brand-gold/[0.06] border-2 border-dashed border-brand-gold/35'
          : !disabled ? 'bg-white/90 border-2 border-brand-blue/15' : ''}
      `}
    />
  )
})
