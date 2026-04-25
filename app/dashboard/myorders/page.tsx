'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { useAuth } from '@/lib/AuthContext'

export default function MyOrdersPage() {
  const { profile } = useAuth()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile) loadPayments() }, [profile])

  async function loadPayments() {
    const snap = await getDocs(query(
      collection(db, 'payments'),
      where('userId', '==', profile!.uid)
    ))
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    setPayments(data)
    setLoading(false)
  }

  const getSteps = (status: string) => [
    { label: 'Chek yuklandi', done: true },
    { label: "Admin ko'rib chiqmoqda", done: status !== 'pending' },
    {
      label: status === 'confirmed' ? '✅ Tasdiqlandi — fayl ochiq'
           : status === 'rejected'  ? '❌ Rad etildi'
           : 'Tasdiqlash kutilmoqda',
      done: status === 'confirmed'
    },
  ]

  if (loading) return (
    <div className="p-6 flex items-center justify-center py-20">
      <div className="text-gray-400 text-sm">Yuklanmoqda...</div>
    </div>
  )

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Mening to'lovlarim</h1>
      <p className="text-sm text-gray-500 mb-6">To'lov tarixi va holati</p>

      {payments.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🧾</div>
          <div className="text-sm">Hozircha to'lovlar yo'q</div>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map(p => {
            const steps = getSteps(p.status)
            return (
              <div key={p.id} className="card">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">🧾</span>
                      <span className="text-sm font-semibold text-gray-900">{p.fileName}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {p.createdAt?.toDate?.()?.toLocaleDateString('uz-UZ') || '—'}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-semibold text-gray-900">{p.amount?.toLocaleString()} so'm</div>
                    <div className="mt-1">
                      {p.status === 'confirmed' && <span className="badge-approved">Tasdiqlangan</span>}
                      {p.status === 'rejected' && <span className="badge-rejected">Rad etilgan</span>}
                      {p.status === 'pending' && <span className="badge-pending">Kutilmoqda</span>}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs
                          ${step.done
                            ? i === 2 && p.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
                            : i === steps.findIndex(s => !s.done) ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                          {step.done ? (i === 2 && p.status === 'rejected' ? '✗' : '✓') : i + 1}
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`w-0.5 h-5 mt-0.5 ${step.done ? 'bg-emerald-200' : 'bg-gray-100'}`} />
                        )}
                      </div>
                      <div className={`text-sm pt-0.5 ${step.done ? 'text-gray-700' : 'text-gray-400'}`}>
                        {step.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`mt-4 rounded-lg px-3 py-2 text-xs
                  ${p.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700'
                  : p.status === 'rejected' ? 'bg-red-50 text-red-600'
                  : 'bg-amber-50 text-amber-600'}`}>
                  📎 Yuklangan chek: {p.chekName}
                </div>

                {p.status === 'rejected' && (
                  <div className="mt-3 bg-red-50 rounded-lg px-3 py-2 text-xs text-red-600">
                    ⚠️ To'lovingiz rad etildi. Admin bilan bog'laning yoki qaytadan to'lov qiling.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
