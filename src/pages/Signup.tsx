import { SignupForm } from '../components/auth/SignupForm'
import { PageShell } from '../components/ui/PageBackground'

export default function Signup() {
  return (
    <PageShell>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <SignupForm />
      </div>
    </PageShell>
  )
}
