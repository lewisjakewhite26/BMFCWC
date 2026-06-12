import { Navbar } from '../components/ui/Navbar'
import { PageShell } from '../components/ui/PageBackground'
import { PaymentStatusIndicator } from '../components/ui/PaymentStatusIndicator'
import { useAuth } from '../hooks/useAuth'
import { useHaptics } from '../hooks/useHaptics'
import { useOpenMatchdayNumber } from '../hooks/useOpenMatchdayNumber'
import {
  HAPTIC_FEEDBACK_OPTIONS,
  previewHaptic,
  type HapticId,
} from '../lib/haptics'

function HapticToggle({
  enabled,
  supported,
  onChange,
}: {
  enabled: boolean
  supported: boolean
  onChange: (enabled: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer">
      <div>
        <p className="font-medium text-brand-navy">Haptic feedback</p>
        <p className="text-sm text-gray-500 mt-0.5">
          {supported
            ? 'Vibration on saves, milestones, and recaps'
            : 'Not supported in this browser — try on your phone'}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={!supported}
        onClick={() => onChange(!enabled)}
        className={`
          relative shrink-0 w-12 h-7 rounded-full transition-colors duration-200
          ${enabled && supported ? 'bg-brand-blue' : 'bg-gray-300'}
          ${!supported ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span
          className={`
            absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm
            transition-transform duration-200
            ${enabled && supported ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </label>
  )
}

function HapticOptionRow({
  label,
  description,
  when,
  hapticId,
  canPreview,
}: {
  label: string
  description: string
  when: string
  hapticId: HapticId
  canPreview: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-brand-blue/8 last:border-0">
      <div className="min-w-0">
        <p className="font-medium text-brand-navy text-sm">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        <p className="text-xs text-gray-400 mt-1">{when}</p>
      </div>
      <button
        type="button"
        disabled={!canPreview}
        onClick={() => previewHaptic(hapticId)}
        className="shrink-0 text-xs font-semibold text-brand-blue px-3 py-2 rounded-pill border border-brand-blue/20 bg-brand-blue/[0.06] min-h-[36px] disabled:opacity-40 disabled:cursor-not-allowed active:bg-brand-blue/10 touch-manipulation"
      >
        Try it
      </button>
    </div>
  )
}

export default function Profile() {
  const { user } = useAuth()
  const openMatchday = useOpenMatchdayNumber()
  const { enabled, supported, setEnabled } = useHaptics()

  return (
    <PageShell>
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-5 sm:py-8 space-y-5 sm:space-y-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-brand-navy mb-0.5">Profile</h1>
          <p className="text-sm text-gray-500">Account and preferences</p>
        </div>

        <div className="glass-card p-4 sm:p-5 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-lg text-brand-navy">{user?.display_name}</p>
            {user && (
              <PaymentStatusIndicator
                hasPaid={user.has_paid ?? false}
                matchdayNumber={openMatchday}
                username={user.username}
              />
            )}
          </div>
          <p className="text-sm text-gray-500">@{user?.username}</p>
          <p className="text-sm font-mono text-brand-blue font-bold mt-2">{user?.total_points ?? 0} pts</p>
        </div>

        <div className="glass-card p-4 sm:p-5 space-y-4">
          <h2 className="font-display text-lg text-brand-navy">Preferences</h2>
          <HapticToggle enabled={enabled} supported={supported} onChange={setEnabled} />
        </div>

        <div className="glass-card p-4 sm:p-5">
          <h2 className="font-display text-lg text-brand-navy mb-1">Haptic feedback</h2>
          <p className="text-sm text-gray-500 mb-3">
            Tap Try it to feel each pattern on a supported device.
          </p>
          {HAPTIC_FEEDBACK_OPTIONS.map((option) => (
            <HapticOptionRow
              key={option.id}
              label={option.label}
              description={option.description}
              when={option.when}
              hapticId={option.id}
              canPreview={supported && enabled}
            />
          ))}
        </div>
      </div>
    </PageShell>
  )
}
