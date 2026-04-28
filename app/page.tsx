'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

export default function Home() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/auth/login')
      else if (profile?.status === 'approved') router.replace('/dashboard')
      else if (profile?.status === 'pending') router.replace('/auth/waiting')
      else router.replace('/auth/login')
    }
  }, [user, profile, loading])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-400 text-sm">Yuklanmoqda...</div>
    </div>
  )
}
