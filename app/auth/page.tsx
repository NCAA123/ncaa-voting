import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Sign In - NCAA Voting Platform',
  description: 'Sign in to the NCAA secure voting platform',
}

export default function AuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">NCAA Voting</h1>
          <p className="mt-2 text-sm text-slate-400">Secure Online Election Platform</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-slate-500">
          This platform uses secure authentication and encryption to protect your voting information.
        </p>
      </div>
    </main>
  )
}
