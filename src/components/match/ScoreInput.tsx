interface ScoreInputProps {
  value: number | ''
  onChange: (value: number | '') => void
  disabled?: boolean
  awaiting?: boolean
}

export function ScoreInput({ value, onChange, disabled = false, awaiting = false }: ScoreInputProps) {
  const isEmpty = value === ''

  return (
    <input
      type="number"
      inputMode="numeric"
      pattern="[0-9]*"
      enterKeyHint="done"
      min={0}
      max={99}
      value={value}
      disabled={disabled}
      onChange={(e) => {
        const val = e.target.value
        if (val === '') {
          onChange('')
        } else {
          const num = parseInt(val, 10)
          if (!isNaN(num) && num >= 0 && num <= 99) onChange(num)
        }
      }}
      className={`
        w-11 h-11 sm:w-16 sm:h-16 text-center text-xl sm:text-3xl font-mono font-bold rounded-xl sm:rounded-2xl
        transition-all duration-200 text-brand-navy touch-manipulation shrink-0
        focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20
        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
        ${disabled ? 'opacity-50 cursor-not-allowed text-gray-400 bg-gray-50 border-2 border-gray-200' : ''}
        ${!disabled && awaiting && isEmpty
          ? 'bg-brand-gold/[0.06] border-2 border-dashed border-brand-gold/35'
          : !disabled ? 'bg-white/90 border-2 border-brand-blue/15' : ''}
      `}
    />
  )
}
