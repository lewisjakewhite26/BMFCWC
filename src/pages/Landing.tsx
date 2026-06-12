import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Navbar } from '../components/ui/Navbar'
import { ClubLogo } from '../components/ui/ClubLogo'
import { PageShell } from '../components/ui/PageBackground'
import { PrizePotBanner } from '../components/ui/PrizePotBanner'
import { usePrizePot } from '../hooks/usePrizePot'
import { hapticRandomEasterEgg } from '../lib/haptics'
import { EasterEggTrackToast } from '../components/ui/EasterEggTrackToast'
import { useEasterEggTrackToast } from '../hooks/useEasterEggTrackToast'

const POINTER_LERP = 0.044
const POINTER_FADE = 0.036
const CURSOR_SMOOTH_LERP = 0.052
const GLOW_LERP_PRIMARY = 0.042
const GLOW_LERP_SECONDARY = 0.026
const GLOW_SIZE = 840
const GLOW_HALF = GLOW_SIZE / 2
const IDLE_MS = 3500
const GRID_SPACING = 28
const GRAVITY_RADIUS = 340
const GRAVITY_RADIUS_SQ = GRAVITY_RADIUS * GRAVITY_RADIUS
const MAX_PULL = 58
const MAX_SWIRL = 16
const BASE_DOT_ALPHA = 0.18
const DOT_COLOR = { r: 43, g: 95, b: 192 }
const ACCENT_COLOR = { r: 212, g: 160, b: 23 }

type GridCell = { bx: number; by: number }

/** Frame-rate independent exponential smoothing */
function frameLerp(base: number, dt: number): number {
  return 1 - (1 - base) ** (dt * 60)
}

function dotFill(force: number, alpha: number) {
  const t = force * 0.35
  const r = DOT_COLOR.r + (ACCENT_COLOR.r - DOT_COLOR.r) * t
  const g = DOT_COLOR.g + (ACCENT_COLOR.g - DOT_COLOR.g) * t
  const b = DOT_COLOR.b + (ACCENT_COLOR.b - DOT_COLOR.b) * t
  return `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${alpha})`
}

function LandingHeroBackdrop({ containerRef }: { containerRef: RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glowPrimaryRef = useRef<HTMLDivElement>(null)
  const glowSecondaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const glowPrimary = glowPrimaryRef.current
    const glowSecondary = glowSecondaryRef.current
    if (!container || !canvas || !glowPrimary || !glowSecondary) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const finePointer = window.matchMedia('(pointer: fine)').matches
    let width = 0
    let height = 0
    let dpr = 1
    let cells: GridCell[] = []

    const target = { x: 0, y: 0 }
    const cursorSoft = { x: 0, y: 0 }
    const smooth = { x: 0, y: 0 }
    const glowPrimaryPos = { x: 0, y: 0 }
    const glowSecondaryPos = { x: 0, y: 0 }
    let strength = 0
    let active = false
    let raf = 0
    let time = 0
    let lastFrame = performance.now()
    let visible = !document.hidden
    let lastMoveTime = performance.now()

    const rebuildGrid = () => {
      cells = []
      const cols = Math.ceil(width / GRID_SPACING) + 1
      const rows = Math.ceil(height / GRID_SPACING) + 1
      const offsetX = (width - (cols - 1) * GRID_SPACING) / 2
      const offsetY = (height - (rows - 1) * GRID_SPACING) / 2

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          cells.push({
            bx: offsetX + col * GRID_SPACING,
            by: offsetY + row * GRID_SPACING,
          })
        }
      }
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.25)
      width = container.clientWidth
      height = container.clientHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      target.x = width / 2
      target.y = height / 2
      rebuildGrid()
      if (!active && strength < 0.02) {
        smooth.x = target.x
        smooth.y = target.y
        cursorSoft.x = target.x
        cursorSoft.y = target.y
        glowPrimaryPos.x = target.x
        glowPrimaryPos.y = target.y
        glowSecondaryPos.x = target.x + 64
        glowSecondaryPos.y = target.y + 48
      }
    }

    const setPointerFromClient = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect()
      target.x = clientX - rect.left
      target.y = clientY - rect.top
      active = true
      lastMoveTime = performance.now()
    }

    const releasePointer = () => {
      active = false
      target.x = width / 2
      target.y = height / 2
      lastMoveTime = performance.now()
    }

    const onVisibility = () => {
      visible = !document.hidden
      if (visible) {
        lastFrame = performance.now()
        raf = requestAnimationFrame(draw)
      }
    }

    const onMove = (e: MouseEvent) => {
      setPointerFromClient(e.clientX, e.clientY)
    }

    const onLeave = () => {
      releasePointer()
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        setPointerFromClient(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        setPointerFromClient(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    const onTouchEnd = () => {
      releasePointer()
    }

    const draw = (now: number) => {
      if (!visible) return

      const dt = Math.min((now - lastFrame) / 1000, 0.05)
      lastFrame = now
      time += dt

      const pointerLerp = frameLerp(POINTER_LERP, dt)
      const cursorLerp = frameLerp(CURSOR_SMOOTH_LERP, dt)
      const glowPrimaryLerp = frameLerp(GLOW_LERP_PRIMARY, dt)
      const glowSecondaryLerp = frameLerp(GLOW_LERP_SECONDARY, dt)
      const strengthLerp = frameLerp(POINTER_FADE, dt)

      smooth.x += (target.x - smooth.x) * pointerLerp
      smooth.y += (target.y - smooth.y) * pointerLerp
      cursorSoft.x += (target.x - cursorSoft.x) * cursorLerp
      cursorSoft.y += (target.y - cursorSoft.y) * cursorLerp

      const targetStrength = active ? 1 : 0
      strength += (targetStrength - strength) * strengthLerp

      const interacting = active || strength > 0.02
      const pointerIdle = now - lastMoveTime > IDLE_MS
      const glowIdle = pointerIdle || !interacting

      const idleDriftX =
        width / 2 + Math.sin(time * 0.11) * 36 + Math.sin(time * 0.047) * 18
      const idleDriftY =
        height / 2 + Math.cos(time * 0.09) * 28 + Math.cos(time * 0.053) * 14

      const breatheX =
        Math.sin(time * 0.31) * 14 + Math.sin(time * 0.13 + 1.2) * 9
      const breatheY =
        Math.cos(time * 0.27) * 12 + Math.cos(time * 0.11 + 0.8) * 8
      const breatheMix = glowIdle ? 1 : 0.28

      const glowTargetX = (glowIdle ? idleDriftX : cursorSoft.x) + breatheX * breatheMix
      const glowTargetY = (glowIdle ? idleDriftY : cursorSoft.y) + breatheY * breatheMix
      const idlePulse = glowIdle ? 1 + Math.sin(time * 0.55) * 0.06 : 1

      glowPrimaryPos.x += (glowTargetX - glowPrimaryPos.x) * glowPrimaryLerp
      glowPrimaryPos.y += (glowTargetY - glowPrimaryPos.y) * glowPrimaryLerp

      const orbitAngle = time * 0.09
      const orbitRadius = glowIdle ? 78 : 62
      const secondaryTargetX = glowPrimaryPos.x + Math.cos(orbitAngle) * orbitRadius
      const secondaryTargetY = glowPrimaryPos.y + Math.sin(orbitAngle) * orbitRadius * 0.82
      glowSecondaryPos.x += (secondaryTargetX - glowSecondaryPos.x) * glowSecondaryLerp
      glowSecondaryPos.y += (secondaryTargetY - glowSecondaryPos.y) * glowSecondaryLerp

      const primaryScale = idlePulse
      const secondaryScale = glowIdle ? 1 + Math.sin(time * 0.42 + 0.9) * 0.045 : 0.98 + Math.sin(time * 0.25) * 0.02

      glowPrimary.style.transform = `translate3d(${glowPrimaryPos.x - GLOW_HALF}px, ${glowPrimaryPos.y - GLOW_HALF}px, 0) scale(${primaryScale})`
      glowSecondary.style.transform = `translate3d(${glowSecondaryPos.x - GLOW_HALF}px, ${glowSecondaryPos.y - GLOW_HALF}px, 0) scale(${secondaryScale})`

      const gx = interacting
        ? smooth.x * 0.55 + glowPrimaryPos.x * 0.45
        : width / 2 + Math.sin(time * 0.18) * 32 + Math.sin(time * 0.07) * 14
      const gy = interacting
        ? smooth.y * 0.55 + glowPrimaryPos.y * 0.45
        : height / 2 + Math.cos(time * 0.15) * 26 + Math.cos(time * 0.06) * 12
      const fieldStrength = interacting ? Math.max(strength, 0.2) : 0.35

      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < cells.length; i++) {
        const { bx, by } = cells[i]
        const dx = gx - bx
        const dy = gy - by
        const distSq = dx * dx + dy * dy

        let x = bx
        let y = by
        let force = 0

        if (distSq > 0.25 && distSq < GRAVITY_RADIUS_SQ) {
          const dist = Math.sqrt(distSq)
          const t = 1 - dist / GRAVITY_RADIUS
          force = t * t * t * fieldStrength

          const invDist = 1 / dist
          const nx = dx * invDist
          const ny = dy * invDist
          const pull = force * MAX_PULL
          const swirl = force * MAX_SWIRL

          x = bx + nx * pull - ny * swirl * 0.65
          y = by + ny * pull + nx * swirl * 0.65
        }

        const alpha = BASE_DOT_ALPHA + force * 0.5
        const radius = 0.9 + force * 1.35

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = dotFill(force, alpha)
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    if (finePointer) {
      container.addEventListener('mousemove', onMove, { passive: true })
      container.addEventListener('mouseleave', onLeave)
    }

    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: true })
    container.addEventListener('touchend', onTouchEnd, { passive: true })
    container.addEventListener('touchcancel', onTouchEnd, { passive: true })

    document.addEventListener('visibilitychange', onVisibility)

    lastFrame = performance.now()
    raf = requestAnimationFrame(draw)

    return () => {
      ro.disconnect()
      container.removeEventListener('mousemove', onMove)
      container.removeEventListener('mouseleave', onLeave)
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
      container.removeEventListener('touchcancel', onTouchEnd)
      document.removeEventListener('visibilitychange', onVisibility)
      cancelAnimationFrame(raf)
    }
  }, [containerRef])

  return (
    <>
      <div
        ref={glowPrimaryRef}
        className="absolute top-0 left-0 rounded-full pointer-events-none z-0 will-change-transform"
        style={{
          width: GLOW_SIZE,
          height: GLOW_SIZE,
          background:
            'radial-gradient(circle, rgba(43,95,192,0.14) 0%, rgba(43,95,192,0.05) 28%, rgba(43,95,192,0.015) 48%, transparent 78%)',
          filter: 'blur(64px)',
        }}
        aria-hidden
      />
      <div
        ref={glowSecondaryRef}
        className="absolute top-0 left-0 rounded-full pointer-events-none z-0 will-change-transform"
        style={{
          width: GLOW_SIZE,
          height: GLOW_SIZE,
          background:
            'radial-gradient(circle, rgba(212,160,23,0.09) 0%, rgba(212,160,23,0.035) 26%, rgba(212,160,23,0.01) 46%, transparent 76%)',
          filter: 'blur(72px)',
        }}
        aria-hidden
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[1] pointer-events-none"
        aria-hidden
      />
    </>
  )
}

const HOW_IT_WORKS = [
  {
    icon: '🎯',
    title: 'Predict the scores',
    body: 'Enter your scoreline for every fixture on the matchday. Both teams, every match.',
  },
  {
    icon: '🔒',
    title: 'Confirm your predictions',
    body: 'Submit your predictions before the matchday closes. Each fixture locks one minute before kickoff.',
  },
  {
    icon: '🏆',
    title: 'Follow the table',
    body: 'Points are updated automatically after each result. See where you stand throughout the tournament.',
  },
]

const POINTS_CARDS = [
  {
    points: 10,
    colorClass: 'text-brand-gold',
    title: 'Correct Score',
    body: 'Exact scoreline correct: if you predicted 2–1 and it finished 2–1, you get 10 points.',
  },
  {
    points: 5,
    colorClass: 'text-brand-blue',
    title: 'Correct Result',
    body: 'Correct result but wrong score: if you predicted 2–1 and it finished 3–1, you still get 5 points.',
  },
]

function GlassTile({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-card p-8 text-center bg-white/70 backdrop-blur-[20px] border border-brand-blue/10 ${className}`}
    >
      {children}
    </div>
  )
}

function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default function Landing() {
  const heroRef = useRef<HTMLElement>(null)
  const [showScrollHint, setShowScrollHint] = useState(true)
  const [crestPulse, setCrestPulse] = useState(false)
  const { track: easterEggTrack, trigger: triggerEasterEgg } = useEasterEggTrackToast()
  const { stats: prizePot, loading: prizePotLoading } = usePrizePot()

  const handleCrestClick = () => {
    triggerEasterEgg()
    setCrestPulse(true)
    window.setTimeout(() => setCrestPulse(false), 900)
  }

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 100) setShowScrollHint(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <PageShell>
      <EasterEggTrackToast track={easterEggTrack} />
      <Navbar />

      <div className="bg-[#f0f4ff]">
        {/* Hero */}
        <section
          ref={heroRef}
          className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-8 select-none touch-manipulation [-webkit-touch-callout:none]"
        >
          <LandingHeroBackdrop containerRef={heroRef} />

          <div className="relative z-10 flex flex-col items-center text-center w-full max-w-[900px] mx-auto">
            <motion.button
              type="button"
              onClick={handleCrestClick}
              animate={crestPulse ? { scale: [1, 1.1, 1], rotate: [0, -4, 4, 0] } : { scale: 1 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="mb-8 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 touch-manipulation"
              aria-label="Bishop Middleham Football Club crest"
            >
              <ClubLogo className="h-20 w-20 object-contain drop-shadow-md pointer-events-none" />
            </motion.button>

            <h1
              className="font-display tracking-tight text-brand-navy leading-[1.05] max-w-[900px]"
              style={{ fontSize: 'clamp(3.5rem, 8vw, 7rem)' }}
            >
              <span className="block font-extrabold">BMFC World Cup</span>
              <span className="block text-brand-gold font-semibold">2026</span>
            </h1>

            <p
              className="text-[#6B7280] font-normal max-w-[500px] mx-auto mt-6 mb-8 leading-relaxed"
              style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}
            >
              Predict the scoreline for every fixture and follow your position throughout the tournament.
            </p>

            <div className="mb-8 w-full">
              <PrizePotBanner stats={prizePot} loading={prizePotLoading} variant="hero" />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-8 py-3 rounded-pill font-semibold text-white bg-brand-blue shadow-[0_4px_16px_rgba(43,95,192,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(43,95,192,0.3)] min-w-[140px]"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-3 rounded-pill font-semibold text-brand-blue bg-white border border-brand-blue/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(13,27,75,0.08)] min-w-[140px]"
              >
                Login
              </Link>
            </div>

            <p className="mt-8 text-[0.8rem] text-[#9ca3af]">
              Est. 1984 · Bishop Middleham Football Club
            </p>
          </div>

          {showScrollHint && (
            <div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-[#9ca3af] text-xl landing-scroll-hint pointer-events-none"
              aria-hidden
            >
              ↓
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="px-4 py-20 sm:py-24">
          <div className="max-w-6xl mx-auto">
            <FadeUp>
              <h2 className="font-display text-2xl sm:text-3xl text-brand-navy text-center mb-12">
                How it works
              </h2>
            </FadeUp>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map((card, i) => (
                <FadeUp key={card.title} delay={i * 0.1}>
                  <GlassTile className="h-full">
                    <div className="text-[2.5rem] mb-4 leading-none" aria-hidden>
                      {card.icon}
                    </div>
                    <h3 className="font-bold text-brand-navy text-lg mb-3">{card.title}</h3>
                    <p className="text-[#6B7280] text-[0.95rem] leading-relaxed">{card.body}</p>
                  </GlassTile>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* How points work */}
        <section className="px-4 pb-24 sm:pb-28">
          <div className="max-w-4xl mx-auto">
            <FadeUp>
              <h2 className="font-display text-2xl sm:text-3xl text-brand-navy text-center mb-12">
                How points work
              </h2>
            </FadeUp>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {POINTS_CARDS.map((card, i) => (
                <FadeUp key={card.title} delay={i * 0.1}>
                  <GlassTile>
                    <div className={`font-display font-bold leading-none ${card.colorClass}`} style={{ fontSize: '4rem' }}>
                      {card.points}
                      <span className="text-lg font-semibold ml-1 align-middle">pts</span>
                    </div>
                    <h3 className="font-bold text-brand-navy text-lg mt-4 mb-3">{card.title}</h3>
                    <p className="text-[#6B7280] text-[0.95rem] leading-relaxed">{card.body}</p>
                  </GlassTile>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
