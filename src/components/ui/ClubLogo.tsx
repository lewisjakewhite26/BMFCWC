interface ClubLogoProps {
  className?: string
  'aria-hidden'?: boolean
}

export function ClubLogo({ className, 'aria-hidden': ariaHidden }: ClubLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Bishop Middleham Football Club crest"
      aria-hidden={ariaHidden}
      className={className}
    />
  )
}
