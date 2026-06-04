import { useState, useEffect } from 'react'
import { getTeamFlagCode, getFlagImageUrl, getTeamAbbreviation } from '../../lib/teamFlags'

interface CountryFlagProps {
  flag: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  align?: 'left' | 'right'
  /** Use 3-letter codes on mobile for match cards */
  card?: boolean
}

export function CountryFlag({ flag: _flag, name, size = 'md', align = 'left', card = false }: CountryFlagProps) {
  const [imgError, setImgError] = useState(false)
  const code = getTeamFlagCode(name)

  useEffect(() => {
    setImgError(false)
  }, [code, name])

  const imgSize = {
    sm: 'w-7 h-5',
    md: 'w-9 h-6',
    lg: 'w-12 h-8',
  }[size]

  const textSize = {
    sm: card ? 'text-[11px] sm:text-xs' : 'text-xs',
    md: 'text-sm sm:text-base',
    lg: 'text-lg',
  }[size]

  const flagWidth = size === 'lg' ? 48 : size === 'md' ? 36 : 28

  const showImage = code && !imgError

  const flagEl = showImage ? (
    <img
      src={getFlagImageUrl(code, flagWidth)}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className={`${imgSize} object-cover rounded-[3px] shadow-sm border border-black/10 shrink-0`}
    />
  ) : (
    <span
      className={`${imgSize} shrink-0 rounded-[3px] bg-brand-light border border-brand-blue/15 flex items-center justify-center text-[10px] font-bold text-brand-blue`}
      aria-hidden
    >
      {getTeamAbbreviation(name).slice(0, 3)}
    </span>
  )

  const nameEl = card ? (
    <span className={`font-semibold text-brand-navy leading-tight min-w-0 ${textSize}`}>
      <span className="sm:hidden">{getTeamAbbreviation(name)}</span>
      <span className="hidden sm:inline line-clamp-2">{name}</span>
    </span>
  ) : (
    <span className={`font-semibold text-brand-navy truncate min-w-0 ${textSize}`}>{name}</span>
  )

  return (
    <div
      className={`flex items-center gap-1.5 min-w-0 max-w-full ${
        card ? 'sm:gap-2' : 'gap-2'
      } ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}
    >
      {flagEl}
      {nameEl}
    </div>
  )
}
