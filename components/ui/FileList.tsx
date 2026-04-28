'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { useAuth } from '@/lib/AuthContext'
import { MedFile, Payment, SUBJECTS, YEARS, LANG_INFO, Lang } from '@/types'
import PayModal from './PayModal'
import PreviewModal from './PreviewModal'

interface Props { kind: 'darslik' | 'test' }

const LANGS = [
  { id: 'all', flag: '🌐', label: 'Barchasi' },
  { id: 'uz', flag: '🇺🇿', label: "O'z" },
  { id: 'ru', flag: '🇷🇺', label: 'Rus' },
  { id: 'en', flag: '🇬🇧', label: 'Eng' },
]

export default function FileList({ kind }: Props) {
  const { profile } = useAuth()
  const [files, setFiles] = useState<any[]>([])
  const [myPayments, setMyPayments] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [langFilter, setLangFilter] = useState('all')
  const [subFilter, setSubFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [payModal, setPayModal] = useState<any | null>(null)
  const [prevModal, setPrevModal] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const isAdmin = profile?.role === 'admin'

  useEffect(() => { if (profile) loadData() }, [profile])

  async function loadData() {
    const filesSnap = await getDocs(query(collection(db, 'files'), where('kind', '==', kind)))
    setFiles(filesSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    if (!isAdmin) {
      const paySnap = await getDocs(query(collection(db, 'payments'), where('userId', '==', profile!.uid)))
      setMyPayments(paySnap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    setLoading(false)
  }

  async function handleDelete(file: any) {
    if (!confirm(`"${file.name}" o'chirilsinmi?`)) return
    await deleteDoc(doc(db, 'files', file.id))
    setFiles(prev => prev.filter(f => f.id !== file.id))
    // Cloudinary dan ham o'chirish (ixtiyoriy — API orqali)
  }

  async function openFile(file: any) {
    if (!file.fileUrl) { alert('Fayl URL topilmadi'); return }
    // Cloudinary dan to'g'ridan yuklab olish
    const a = document.createElement('a')
    a.href = `/api/download?url=${encodeURIComponent(file.fileUrl)}&name=${encodeURIComponent(file.name)}`
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const confirmedIds = myPayments.filter(p => p.status === 'confirmed').map(p => p.fileId)
  const pendingIds = myPayments.filter(p => p.status === 'pending').map(p => p.fileId)

  const filtered = files.filter(f => {
    if (langFilter !== 'all' && f.lang !== langFilter) return false
    if (subFilter !== 'all' && f.subject !== subFilter) return false
    if (yearFilter !== 'all' && f.year !== yearFilter) return false
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) &&
      !f.subject.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const subs = ['all', ...files.map((f: any) => f.subject as string).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)]
  const years = ['all', ...YEARS.filter(y => files.some((f: any) => f.year === y))]
  const isBook = kind === 'darslik'
  const color = isBook ? 'text-blue-700' : 'text-red-600'

  if (loading) return (
    <div className="p-6 flex items-center justify-center py-20">
      <div className="text-gray-400 text-sm">Yuklanmoqda...</div>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl">
      <h1 className={`text-xl font-semibold mb-1 ${color}`}>{isBook ? '📘 Darsliklar' : '📝 Testlar'}</h1>
      <p className="text-sm text-gray-500 mb-5">{isBook ? "O'quv qo'llanmalar" : 'Nazorat va imtihon testlari'}</p>

      <input className="w-full max-w-sm px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4 focus:outline-none focus:border-blue-500"
        placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="mb-1 text-xs text-gray-400">Til:</div>
      <div className="flex gap-2 flex-wrap mb-3">
        {LANGS.map(l => (
          <button key={l.id} onClick={() => setLangFilter(l.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
              ${langFilter === l.id ? 'bg-blue-50 text-blue-700 border-blue-200' : 'border-gray-200 text-gray-500'}`}>
            {l.flag} {l.label}
          </button>
        ))}
      </div>

      <div className="mb-1 text-xs text-gray-400">Fan:</div>
      <div className="flex gap-2 flex-wrap mb-3">
        {subs.map(s => (
          <button key={s} onClick={() => setSubFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
              ${subFilter === s ? 'bg-blue-50 text-blue-700 border-blue-200' : 'border-gray-200 text-gray-500'}`}>
            {s === 'all' ? 'Barchasi' : s}
          </button>
        ))}
      </div>

      <div className="mb-1 text-xs text-gray-400">Kurs:</div>
      <div className="flex gap-2 flex-wrap mb-5">
        {years.map(y => (
          <button key={y} onClick={() => setYearFilter(y)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
              ${yearFilter === y ? 'bg-blue-50 text-blue-700 border-blue-200' : 'border-gray-200 text-gray-500'}`}>
            {y === 'all' ? 'Barchasi' : y}
          </button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-400">Resurs topilmadi</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((f: any) => {
              const hasPaid = confirmedIds.includes(f.id)
              const hasPending = pendingIds.includes(f.id)
              const canFull = isAdmin || !f.isPaid || hasPaid
              const { flag } = LANG_INFO[f.lang as Lang] || { flag: '🌐' }

              return (
                <div key={f.id} className="flex items-center gap-3 py-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${isBook ? 'bg-blue-50' : 'bg-red-50'}`}>
                    {isBook ? '📘' : '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{f.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {f.subject} · {f.year}{f.kind === 'test' && f.qCount ? ` · ${f.qCount} ta savol` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    <span className={`badge-${f.lang}`}>{flag}</span>
                    {f.isPaid
                      ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">{f.price?.toLocaleString()} so'm</span>
                      : <span className="badge-free">Bepul</span>
                    }
                    {isAdmin ? (
                      <>
                        <button onClick={() => setPrevModal(f)} className="text-xs border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50">Ko'rish</button>
                        <button onClick={() => handleDelete(f)} className="text-xs border border-red-100 text-red-500 px-2.5 py-1 rounded-lg hover:bg-red-50">O'chirish</button>
                      </>
                    ) : hasPaid ? (
                      <button onClick={() => openFile(f)} className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700">Yuklab olish</button>
                    ) : hasPending ? (
                      <span className="badge-pending">Kutilmoqda</span>
                    ) : f.isPaid ? (
                      <button onClick={() => setPayModal(f)} className="text-xs bg-blue-700 text-white px-2.5 py-1 rounded-lg hover:bg-blue-800">Sotib olish</button>
                    ) : (
                      <button onClick={() => openFile(f)} className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700">Ochish</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {payModal && (
        <PayModal file={payModal} onClose={() => setPayModal(null)}
          onSuccess={() => { setPayModal(null); loadData() }} />
      )}
      {prevModal && (
        <PreviewModal file={prevModal}
          canFull={isAdmin || !prevModal.isPaid || confirmedIds.includes(prevModal.id)}
          onClose={() => setPrevModal(null)}
          onBuy={() => { setPrevModal(null); setPayModal(prevModal) }}
          onDownload={() => openFile(prevModal)} />
      )}
    </div>
  )
}
