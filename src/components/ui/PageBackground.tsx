import { useAuth } from '../../hooks/useAuth'

export function PageBackground() {
  return <div className="fixed inset-0 page-bg -z-10" aria-hidden />
}

export function PageShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <div
      className={`min-h-screen relative page-enter ${
        user ? 'pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0' : ''
      }`}
    >
      <PageBackground />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
