'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // User is logged in, check their role and redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profile?.role === 'admin' || profile?.role === 'superadmin') {
          router.push('/admin/elections')
        } else {
          router.push('/dashboard/elections')
        }
      } else {
        // Not logged in, redirect to login
        router.push('/auth')
      }
    }

    checkAuth()
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="text-center">
        <p className="text-slate-400">Redirecting...</p>
      </div>
    </main>
  )
}
