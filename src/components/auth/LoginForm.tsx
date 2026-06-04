import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { PinInput } from './PinInput'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passcode.length !== 4) {
      toast.error('Enter your 4-digit passcode')
      return
    }

    setLoading(true)
    setError(false)

    try {
      await login(username.trim(), passcode)
      toast.success('Signed in')
      navigate('/dashboard')
    } catch {
      setError(true)
      toast.error('Invalid username or passcode')
      setTimeout(() => setError(false), 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6 w-full max-w-md">
      <div className="text-center">
        <img
          src="/logo.png"
          alt="BMFC"
          className="h-20 w-20 mx-auto mb-4 object-contain drop-shadow-md"
          onError={(e) => { (e.target as HTMLImageElement).src = '/logo.svg' }}
        />
        <h1 className="font-display text-2xl text-brand-navy">Welcome back</h1>
        <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
      </div>

      <div>
        <label className="block text-sm text-gray-500 mb-2">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-field"
          placeholder="Your username"
          autoComplete="username"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-500 mb-3 text-center">4-Digit Passcode</label>
        <PinInput value={passcode} onChange={setPasscode} error={error} autoFocus />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Signing in...' : 'Login'}
      </button>

      <p className="text-center text-sm text-gray-500">
        No account?{' '}
        <Link to="/signup" className="text-brand-blue font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  )
}
