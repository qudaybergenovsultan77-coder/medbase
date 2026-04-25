'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/auth/login')
      else if (profile?.status === 'pending') router.replace('/auth/login')
      else if (profile?.status === 'rejected') router.replace('/auth/login')
    }
  }, [user, profile, loading])

  async function logout() {
    await signOut(auth)
    router.replace('/auth/login')
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Yuklanmoqda...</div>
      </div>
    )
  }

  const isAdmin = profile.role === 'admin'

  const navItem = (href: string, icon: string, label: string, badge?: number) => {
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link href={href} key={href}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
          ${active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
        <span>{icon}</span>
        <span className="flex-1">{label}</span>
        {badge && badge > 0 && (
          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{badge}</span>
        )}
      </Link>
    )
  }

  const initials = profile.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-56 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-100">
          <div className="w-7 h-7 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 22 22">
              <rect x="8" y="1" width="6" height="20" rx="2" fill="white"/>
              <rect x="1" y="8" width="20" height="6" rx="2" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">MedBase</div>
            <div className="text-xs text-gray-400">Tibbiyot platformasi</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItem('/dashboard', '⊞', 'Dashboard')}

          <div className="pt-3 pb-1">
            <p className="text-xs font-medium text-gray-300 uppercase tracking-wider px-3">Resurslar</p>
          </div>
          {navItem('/dashboard/darsliklar', '📘', 'Darsliklar')}
          {navItem('/dashboard/testlar', '📝', 'Testlar')}

          {isAdmin ? (
            <>
              <div className="pt-3 pb-1">
                <p className="text-xs font-medium text-gray-300 uppercase tracking-wider px-3">Admin</p>
              </div>
              {navItem('/dashboard/admin/payments', '💳', 'To\'lovlar')}
              {navItem('/dashboard/admin/users', '👤', 'Talabalar')}
              {navItem('/dashboard/admin/upload', '+', 'Fayl yuklash')}
            </>
          ) : (
            <>
              <div className="pt-3 pb-1">
                <p className="text-xs font-medium text-gray-300 uppercase tracking-wider px-3">Mening</p>
              </div>
              {navItem('/dashboard/myfiles', '📂', 'Resurslarim')}
              {navItem('/dashboard/myorders', '🧾', 'To\'lovlarim')}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700 flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {profile.fullName.split(' ').slice(0, 2).join(' ')}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {isAdmin ? 'Administrator' : `${profile.year} · ${profile.faculty}`}
              </div>
            </div>
          </div>
          {isAdmin && <span className="badge-pending mb-2 block w-fit" style={{background:'#EEEDFE',color:'#3C3489'}}>Admin</span>}
          <button onClick={logout}
            className="w-full text-sm text-gray-500 border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 transition-colors">
            Chiqish
          </button>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
