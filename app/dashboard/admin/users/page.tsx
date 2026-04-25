'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore'

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')))
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    setUsers(data)
    setLoading(false)
  }

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    await updateDoc(doc(db, 'users', id), { status })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u))
  }

  const filtered = filter === 'all' ? users : users.filter(u => u.status === filter)
  const pendingCount = users.filter(u => u.status === 'pending').length

  const statusBadge = (status: string) => {
    if (status === 'approved') return <span className="badge-approved">✓ Tasdiqlangan</span>
    if (status === 'rejected') return <span className="badge-rejected">✗ Rad etilgan</span>
    return <span className="badge-pending">⏳ Kutilmoqda</span>
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Talabalar</h1>
      <p className="text-sm text-gray-500 mb-6">Ro'yxatdan o'tgan talabalarni boshqarish</p>

      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <div className="text-sm font-medium text-amber-700">{pendingCount} ta talaba tasdiqlashni kutmoqda</div>
              <div className="text-xs text-amber-500">Yangi ro'yxatdan o'tganlarni ko'rib chiqing</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filter === f ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            {f === 'all' ? `Barchasi (${users.length})` :
             f === 'pending' ? `Kutilmoqda (${pendingCount})` :
             f === 'approved' ? 'Tasdiqlangan' : 'Rad etilgan'}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-10 text-sm text-gray-400">Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-400">Talabalar topilmadi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Talaba', 'Pochta', 'Fakultet', 'Kurs / Guruh', 'Holat', 'Amallar'].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-medium text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700 flex-shrink-0">
                          {u.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{u.fullName}</div>
                          <div className="text-xs text-gray-400">{u.year}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500">{u.email}</td>
                    <td className="py-3 px-3 text-xs text-gray-700">{u.faculty}</td>
                    <td className="py-3 px-3 text-xs text-gray-500">{u.year} · {u.groupName}</td>
                    <td className="py-3 px-3">{statusBadge(u.status)}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1.5">
                        {u.status === 'pending' && (
                          <>
                            <button onClick={() => updateStatus(u.id, 'approved')}
                              className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700">✓ Tasdiqlash</button>
                            <button onClick={() => updateStatus(u.id, 'rejected')}
                              className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg hover:bg-red-600">✗ Rad</button>
                          </>
                        )}
                        {u.status === 'approved' && (
                          <button onClick={() => updateStatus(u.id, 'rejected')}
                            className="text-xs border border-red-200 text-red-500 px-2.5 py-1 rounded-lg hover:bg-red-50">Bloklash</button>
                        )}
                        {u.status === 'rejected' && (
                          <button onClick={() => updateStatus(u.id, 'approved')}
                            className="text-xs border border-emerald-200 text-emerald-600 px-2.5 py-1 rounded-lg hover:bg-emerald-50">Tiklash</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
