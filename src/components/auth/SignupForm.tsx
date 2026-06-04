import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { PinInput } from './PinInput'

export function SignupForm() {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [passcode, setPasscode] = useState('')
  const [confirmPasscode, setConfirmPasscode] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      toast.error('Username must be 3-20 alphanumeric characters or underscores')
      return
    }

    if (passcode.length !== 4 || !/^\d{4}$/.test(passcode)) {
      toast.error('Passcode must be exactly 4 digits')
      return
    }

    if (passcode !== confirmPasscode) {
      toast.error('Passcodes do not match')
      return
    }

    setLoading(true)

    try {
      await signup(username.trim(), displayName.trim(), passcode)
      setSuccess(true)
      toast.success('Account created!')
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Signup failed'
      toast.error(msg.includes('already taken') ? 'Username already taken' : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="glass-card p-8 text-center w-full max-w-md">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="font-display text-2xl text-brand-navy">Account created</h2>
        <p className="text-gray-500 mt-2">Taking you to your predictions...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5 w-full max-w-md">
      <div className="text-center">
        <img
          src="/logo.png"
          alt="BMFC"
          className="h-20 w-20 mx-auto mb-4 object-contain drop-shadow-md"
          onError={(e) => { (e.target as HTMLImageElement).src = '/logo.svg' }}
        />
        <h1 className="font-display text-2xl text-brand-navy">Create an account</h1>
        <p className="text-gray-500 text-sm mt-1">Sign up to enter your predictions</p>
      </div>

      <div>
        <label className="block text-sm text-gray-500 mb-2">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-field"
          placeholder="Choose a username"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-500 mb-2">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="input-field"
          placeholder="Shown on The Table"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-500 mb-3 text-center">Create 4-Digit Passcode</label>
        <PinInput value={passcode} onChange={setPasscode} />
      </div>

      <div>
        <label className="block text-sm text-gray-500 mb-3 text-center">Confirm Passcode</label>
        <PinInput value={confirmPasscode} onChange={setConfirmPasscode} />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-blue font-medium hover:underline">
          Login
        </Link>
      </p>
    </form>
  )
}
