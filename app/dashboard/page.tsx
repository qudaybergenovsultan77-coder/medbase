'use client'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { useAuth } from '@/lib/AuthContext'
import { MedFile } from '@/types'
import Link from 'next/link'

export default function DashboardPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ files: 0, freeFiles: 0, pendingPay: 0, revenue: 0, pendingUsers: 0 })
  const [myStats, setMyStats] = useState({ confirmed: 0, pending: 0 })
  const [recentFiles, setRecentFiles] = useState<MedFile[]>([])

  useEffect(() => {
    if (!profile) return
    loadData()
  }, [profile])

  async function loadData() {
    const isAdmin = profile?.role === 'admin'

    // Recent files — orderBy yo'q, index kerak emas
    const filesSnap = await getDocs(collection(db, 'files'))
    const allFiles = filesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as MedFile[]
    const recent = allFiles.slice(-5).reverse()
    setRecentFiles(recent)

    if (isAdmin) {
      const paymentsSnap = await getDocs(collection(db, 'payments'))
      const usersSnap = await getDocs(query(collection(db, 'users'), where('status', '==', 'pending'), where('role', '==', 'student')))
      const payments = paymentsSnap.docs.map(d => d.data())
      const revenue = payments.filter(p => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0)
      const pendingPay = payments.filter(p => p.status === 'pending').length
      setStats({
        files: allFiles.length,
        freeFiles: allFiles.filter(f => !f.isPaid).length,
        pendingPay,
        revenue,
        pendingUsers: usersSnap.size,
      })
    } else {
      const myPaySnap = await getDocs(query(collection(db, 'payments'), where('userId', '==', profile?.uid)))
      const myPays = myPaySnap.docs.map(d => d.data())
      setMyStats({
        confirmed: myPays.filter(p => p.status === 'confirmed').length,
        pending: myPays.filter(p => p.status === 'pending').length,
      })
      setStats(prev => ({
        ...prev,
        files: allFiles.length,
        freeFiles: allFiles.filter(f => !f.isPaid).length,
      }))
    }
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        {isAdmin ? 'Admin dashboard' : `Xush kelibsiz, ${profile?.fullName?.split(' ')[0]}!`}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {isAdmin ? 'MedBase boshqaruv paneli' : `${profile?.faculty} · ${profile?.year} · ${profile?.groupName}`}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {isAdmin ? (
          <>
            <div className="card"><div className="text-2xl font-semibold">{stats.files}</div><div className="text-xs text-gray-500 mt-1">Jami resurslar</div></div>
            <div className="card"><div className="text-2xl font-semibold text-amber-600">{stats.pendingUsers}</div><div className="text-xs text-gray-500 mt-1">Kutilayotgan talabalar</div></div>
            <div className="card"><div className="text-2xl font-semibold text-orange-500">{stats.pendingPay}</div><div className="text-xs text-gray-500 mt-1">Kutilayotgan to'lov</div></div>
            <div className="card"><div className="text-2xl font-semibold text-emerald-600">{(stats.revenue / 1000).toFixed(0)}k</div><div className="text-xs text-gray-500 mt-1">Daromad (so'm)</div></div>
          </>
        ) : (
          <>
            <div className="card"><div className="text-2xl font-semibold text-blue-700">{stats.files}</div><div className="text-xs text-gray-500 mt-1">Jami resurslar</div></div>
            <div className="card"><div className="text-2xl font-semibold">{stats.freeFiles}</div><div className="text-xs text-gray-500 mt-1">Bepul resurslar</div></div>
            <div className="card"><div className="text-2xl font-semibold text-amber-600">{myStats.pending}</div><div className="text-xs text-gray-500 mt-1">Kutilayotgan to'lov</div></div>
            <div className="card"><div className="text-2xl font-semibold text-emerald-600">{myStats.confirmed}</div><div className="text-xs text-gray-500 mt-1">Sotib olingan</div></div>
          </>
        )}
      </div>

      {/* Admin alert */}
      {isAdmin && stats.pendingPay > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <div className="text-sm font-medium text-amber-700">{stats.pendingPay} ta to'lov tasdiqlashni kutmoqda</div>
              <div className="text-xs text-amber-500">Chekni ko'rib chiqing va tasdiqlang</div>
            </div>
          </div>
          <Link href="/dashboard/admin/payments"
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors">
            Ko'rish →
          </Link>
        </div>
      )}

      {/* Recent files */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Yangi resurslar</h2>
          <Link href="/dashboard/darsliklar" className="text-xs text-blue-700 hover:underline">Barchasi →</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentFiles.map(f => (
            <div key={f.id} className="flex items-center gap-3 py-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0
                ${f.kind === 'darslik' ? 'bg-blue-50' : 'bg-red-50'}`}>
                {f.kind === 'darslik' ? '📘' : '📝'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{f.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{f.subject} · {f.year}</div>
              </div>
              {f.isPaid
                ? <span className="text-xs font-medium text-emerald-600 whitespace-nowrap">{f.price?.toLocaleString()} so'm</span>
                : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">Bepul</span>
              }
            </div>
          ))}
          {recentFiles.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400">Hozircha resurslar yo'q</div>
          )}
        </div>
      </div>
    </div>
  )
}
