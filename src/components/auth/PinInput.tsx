import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react'
import { motion } from 'framer-motion'

interface PinInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean
  autoFocus?: boolean
}

export function PinInput({
  length = 4,
  value,
  onChange,
  disabled = false,
  error = false,
  autoFocus = false,
}: PinInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const [focused, setFocused] = useState(autoFocus ? 0 : -1)
  const [filledIndex, setFilledIndex] = useState(-1)

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus()
  }, [autoFocus])

  const digits = value.padEnd(length, ' ').split('').slice(0, length)

  const updateValue = (index: number, digit: string) => {
    const arr = value.split('')
    while (arr.length < length) arr.push('')
    arr[index] = digit
    const newVal = arr.join('').replace(/\s/g, '').slice(0, length)
    onChange(newVal)

    if (digit) {
      setFilledIndex(index)
      setTimeout(() => setFilledIndex(-1), 150)
    }

    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[index]?.trim()) {
        updateValue(index, '')
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus()
        updateValue(index - 1, '')
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    onChange(pasted)
    const nextIndex = Math.min(pasted.length, length - 1)
    inputsRef.current[nextIndex]?.focus()
  }

  return (
    <div className={`flex gap-2.5 sm:gap-3 justify-center ${error ? 'pin-shake' : ''}`}>
      {Array.from({ length }).map((_, i) => (
        <motion.input
          key={i}
          ref={(el) => { inputsRef.current[i] = el }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digits[i]?.trim() || ''}
          disabled={disabled}
          onFocus={() => setFocused(i)}
          onBlur={() => setFocused(-1)}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '')
            if (val.length <= 1) updateValue(i, val)
          }}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          animate={filledIndex === i ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 0.15 }}
          className={`
            w-[3.25rem] h-[3.25rem] sm:w-14 sm:h-14 text-center text-2xl font-mono font-semibold rounded-2xl
            bg-white/80 border-2 transition-all duration-200 text-brand-navy touch-manipulation
            focus:outline-none
            ${error ? 'border-gray-300' : focused === i ? 'border-brand-blue ring-2 ring-brand-blue/20' : 'border-brand-blue/15'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
      ))}
    </div>
  )
}
