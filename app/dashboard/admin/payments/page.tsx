'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'

type Filter = 'all' | 'pending' | 'confirmed' | 'rejected'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [chekModal, setChekModal] = useState<any | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => { loadPayments() }, [])

  async function loadPayments() {
    const snap = await getDocs(query(collection(db, 'payments'), orderBy('createdAt', 'desc')))
    setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  async function updateStatus(id: string, status: 'confirmed' | 'rejected') {
    setLoadingId(id)
    await updateDoc(doc(db, 'payments', id), {
      status,
      reviewedAt: serverTimestamp(),
    })
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    setLoadingId(null)
  }

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter)
  const pendingCount = payments.filter(p => p.status === 'pending').length
  const confirmedCount = payments.filter(p => p.status === 'confirmed').length
  const revenue = payments.filter(p => p.status === 'confirmed').reduce((s, p) => s + (p.amount || 0), 0)

  const statusBadge = (status: string) => {
    if (status === 'confirmed') return <span className="badge-approved">✓ Tasdiqlangan</span>
    if (status === 'rejected') return <span className="badge-rejected">✗ Rad etilgan</span>
    return <span className="badge-pending">⏳ Kutilmoqda</span>
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">To'lovlar boshqaruvi</h1>
      <p className="text-sm text-gray-500 mb-6">Chekli to'lovlarni ko'rib chiqish va tasdiqlash</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card"><div className="text-2xl font-semibold text-amber-600">{pendingCount}</div><div className="text-xs text-gray-500 mt-1">Kutilayotgan</div></div>
        <div className="card"><div className="text-2xl font-semibold text-emerald-600">{confirmedCount}</div><div className="text-xs text-gray-500 mt-1">Tasdiqlangan</div></div>
        <div className="card"><div className="text-2xl font-semibold text-emerald-600">{revenue.toLocaleString()}</div><div className="text-xs text-gray-500 mt-1">Jami daromad (so'm)</div></div>
      </div>

      {/* Alert */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <div className="text-sm font-medium text-amber-700">{pendingCount} ta to'lov tasdiqlashni kutmoqda</div>
              <div className="text-xs text-amber-500">Chekni ko'rib chiqing, bank ilovangizdan tekshiring va tasdiqlang</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'pending', 'confirmed', 'rejected'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filter === f ? 'bg-blue-700 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
            {f === 'all' ? 'Barchasi' : f === 'pending' ? `Kutilmoqda (${pendingCount})` : f === 'confirmed' ? 'Tasdiqlangan' : 'Rad etilgan'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="text-center py-10 text-sm text-gray-400">Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-400">To'lovlar topilmadi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Talaba', 'Resurs', 'Miqdor', 'Sana', 'Chek', 'Holat', 'Amal'].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-medium text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <div className="font-medium text-gray-900">{p.userName}</div>
                      <div className="text-xs text-gray-400">{p.userEmail}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="max-w-[150px] truncate text-gray-700 text-xs">{p.fileName}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-emerald-700">{p.amount?.toLocaleString()}</span>
                      <span className="text-xs text-gray-400"> so'm</span>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-400">
                      {p.createdAt?.toDate?.()?.toLocaleDateString('uz-UZ') || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <button onClick={() => setChekModal(p)}
                        className="text-xs text-blue-700 hover:underline">
                        📎 Ko'rish
                      </button>
                    </td>
                    <td className="py-3 px-3">{statusBadge(p.status)}</td>
                    <td className="py-3 px-3">
                      {p.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button onClick={() => updateStatus(p.id, 'confirmed')} disabled={loadingId === p.id}
                            className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 disabled:opacity-50">✓</button>
                          <button onClick={() => updateStatus(p.id, 'rejected')} disabled={loadingId === p.id}
                            className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg hover:bg-red-600 disabled:opacity-50">✗</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chek modal — Cloudinary URL dan rasm ko'rsatish */}
      {chekModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="p-6">
              <div className="text-base font-semibold mb-4">🧾 To'lov cheki</div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
                <div className="text-gray-400">Talaba</div><div className="font-medium">{chekModal.userName}</div>
                <div className="text-gray-400">Resurs</div><div className="truncate text-xs">{chekModal.fileName}</div>
                <div className="text-gray-400">Miqdor</div><div className="font-semibold text-emerald-700">{chekModal.amount?.toLocaleString()} so'm</div>
                <div className="text-gray-400">Sana</div><div className="text-xs">{chekModal.createdAt?.toDate?.()?.toLocaleDateString('uz-UZ') || '—'}</div>
                <div className="text-gray-400">Holat</div><div>{statusBadge(chekModal.status)}</div>
              </div>

              {/* Chek rasm — Cloudinary URL dan */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
                <div className="text-xs text-gray-400 mb-2">📎 {chekModal.chekName}</div>
                {chekModal.chekUrl ? (
                  <>
                    <img
                      src={chekModal.chekUrl}
                      alt="To'lov cheki"
                      className="max-h-64 object-contain mx-auto rounded-lg border border-gray-100"
                    />
                    <a href={chekModal.chekUrl} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-700 hover:underline mt-2 inline-block">
                      To'liq o'lchamda ochish ↗
                    </a>
                  </>
                ) : (
                  <div className="h-24 flex items-center justify-center text-gray-400 text-sm">
                    Chek URL topilmadi
                  </div>
                )}
              </div>

              {chekModal.status === 'pending' && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-xs text-amber-700">
                  ⚠️ Tasdiqlashdan oldin bank ilovangizdan to'lov kelganini tekshiring!
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button onClick={() => setChekModal(null)} className="btn-secondary py-2 px-4">Yopish</button>
                {chekModal.status === 'pending' && (
                  <>
                    <button onClick={() => { updateStatus(chekModal.id, 'rejected'); setChekModal(null) }}
                      className="btn-danger py-2 px-4">✗ Rad etish</button>
                    <button onClick={() => { updateStatus(chekModal.id, 'confirmed'); setChekModal(null) }}
                      className="btn-success py-2 px-4">✓ Tasdiqlash</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
