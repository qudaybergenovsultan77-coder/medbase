'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { useAuth } from '@/lib/AuthContext'
import { LANG_INFO, Lang } from '@/types'

export default function MyFilesPage() {
  const { profile } = useAuth()
  const [paidFiles, setPaidFiles] = useState<any[]>([])
  const [freeFiles, setFreeFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile) loadData() }, [profile])

  async function loadData() {
    const paySnap = await getDocs(query(
      collection(db, 'payments'),
      where('userId', '==', profile!.uid),
      where('status', '==', 'confirmed')
    ))
    const paidIds = paySnap.docs.map(d => d.data().fileId)

    if (paidIds.length > 0) {
      const allSnap = await getDocs(collection(db, 'files'))
      setPaidFiles(allSnap.docs.filter(d => paidIds.includes(d.id)).map(d => ({ id: d.id, ...d.data() })))
    }

    const freeSnap = await getDocs(query(collection(db, 'files'), where('isPaid', '==', false)))
    setFreeFiles(freeSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  function openFile(f: any) {
    if (f.fileUrl) window.open(f.fileUrl, '_blank')
    else alert('Fayl URL topilmadi')
  }

  const FileRow = ({ f }: { f: any }) => {
    const { flag } = LANG_INFO[f.lang as Lang] || { flag: '🌐' }
    return (
      <div className="flex items-center gap-3 py-3.5 border-b border-gray-50 last:border-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0
          ${f.kind === 'darslik' ? 'bg-blue-50' : 'bg-red-50'}`}>
          {f.kind === 'darslik' ? '📘' : '📝'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{f.name}</div>
          <div className="text-xs text-gray-400 mt-0.5">{f.subject} · {f.year}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`badge-${f.lang}`}>{flag}</span>
          <button onClick={() => openFile(f)} className="btn-success text-xs py-1.5 px-3">
            Yuklab olish
          </button>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center py-20">
      <div className="text-gray-400 text-sm">Yuklanmoqda...</div>
    </div>
  )

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Mening resurslarim</h1>
      <p className="text-sm text-gray-500 mb-6">Sotib olingan va bepul materiallar</p>

      {paidFiles.length > 0 && (
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span>✅</span>
            <h2 className="text-sm font-semibold text-gray-900">Sotib olingan ({paidFiles.length})</h2>
          </div>
          {paidFiles.map(f => <FileRow key={f.id} f={f} />)}
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span>🆓</span>
          <h2 className="text-sm font-semibold text-gray-900">Bepul resurslar ({freeFiles.length})</h2>
        </div>
        {freeFiles.length === 0
          ? <div className="text-center py-8 text-sm text-gray-400">Bepul resurslar yo'q</div>
          : freeFiles.map(f => <FileRow key={f.id} f={f} />)
        }
      </div>

      {paidFiles.length === 0 && freeFiles.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📂</div>
          <div className="text-sm">Hali resurslar yo'q</div>
        </div>
      )}
    </div>
  )
}
