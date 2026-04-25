'use client'
import { useState, useRef } from 'react'
import { db, storage } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { useAuth } from '@/lib/AuthContext'
import { SUBJECTS, YEARS } from '@/types'

type Kind = 'darslik' | 'test'
type Lang = 'uz' | 'ru' | 'en'

export default function UploadPage() {
  const { profile } = useAuth()
  const [kind, setKind] = useState<Kind>('darslik')
  const [lang, setLang] = useState<Lang>('uz')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '', description: '', subject: SUBJECTS[0],
    year: YEARS[0], price: '', qCount: '', isPaid: false,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) { setError('Iltimos fayl tanlang'); return }
    if (!form.name || !form.description) { setError('Nom va tavsifni kiriting'); return }
    if (form.isPaid && !form.price) { setError('Narxni kiriting'); return }

    setLoading(true)
    setError('')
    setProgress(0)

    try {
      // 1. Faylni Firebase Storage ga yuklash
      const ext = selectedFile.name.split('.').pop()
      const filePath = `files/${kind}/${Date.now()}_${selectedFile.name}`
      const storageRef = ref(storage, filePath)

      await new Promise<void>((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, selectedFile)
        uploadTask.on(
          'state_changed',
          snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          () => resolve()
        )
      })

      // 2. Firestore ga yozish
      await addDoc(collection(db, 'files'), {
        kind,
        name: form.name,
        description: form.description,
        subject: form.subject,
        year: form.year,
        lang,
        isPaid: form.isPaid,
        price: form.isPaid ? parseInt(form.price) : 0,
        filePath,
        fileSize: `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`,
        qCount: kind === 'test' ? parseInt(form.qCount) || null : null,
        uploadedBy: profile?.uid,
        createdAt: serverTimestamp(),
      })

      setSuccess(true)
      setForm({ name: '', description: '', subject: SUBJECTS[0], year: YEARS[0], price: '', qCount: '', isPaid: false })
      setSelectedFile(null)
      setProgress(0)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err: any) {
      setError('Xato: ' + (err.message || 'Noma\'lum xato'))
    }

    setLoading(false)
  }

  const langOptions: { id: Lang; flag: string; label: string }[] = [
    { id: 'uz', flag: '🇺🇿', label: "O'zbekcha" },
    { id: 'ru', flag: '🇷🇺', label: 'Русский' },
    { id: 'en', flag: '🇬🇧', label: 'English' },
  ]

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Fayl yuklash</h1>
      <p className="text-sm text-gray-500 mb-6">Yangi darslik yoki test qo'shish</p>

      {/* Kind selector */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button type="button" onClick={() => setKind('darslik')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${kind === 'darslik' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
          📘 Darslik
        </button>
        <button type="button" onClick={() => setKind('test')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${kind === 'test' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
          📝 Test
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File drop */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fayl tanlash</label>
          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors
            ${selectedFile ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-blue-300 bg-gray-50'}`}>
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.docx,.doc"
              onChange={e => e.target.files?.[0] && setSelectedFile(e.target.files[0])} />
            {selectedFile ? (
              <div className="text-center">
                <div className="text-2xl mb-1">✅</div>
                <div className="text-sm font-medium text-emerald-700">{selectedFile.name}</div>
                <div className="text-xs text-emerald-500">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-3xl mb-2">{kind === 'darslik' ? '📘' : '📝'}</div>
                <div className="text-sm font-medium text-gray-500">Fayl tanlash uchun bosing</div>
                <div className="text-xs text-gray-400 mt-1">PDF, DOCX — 50 MB gacha</div>
              </div>
            )}
          </label>
        </div>

        {/* Progress bar */}
        {loading && progress > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Yuklanmoqda...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomi *</label>
          <input className="input" placeholder={kind === 'darslik' ? 'Darslik nomi...' : 'Test to\'plami nomi...'}
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tavsif *</label>
          <textarea className="input resize-none" rows={3} placeholder="Qisqacha tavsif..."
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fan *</label>
            <select className="input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kurs *</label>
            <select className="input" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Lang */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Til *</label>
          <div className="flex gap-2">
            {langOptions.map(l => (
              <button key={l.id} type="button" onClick={() => setLang(l.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors
                  ${lang === l.id ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {l.flag} {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Test qCount */}
        {kind === 'test' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Savollar soni</label>
            <input className="input" type="number" placeholder="100"
              value={form.qCount} onChange={e => setForm({ ...form, qCount: e.target.value })} />
          </div>
        )}

        {/* Narx */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm font-medium text-gray-700">Narx turi</label>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button type="button" onClick={() => setForm({ ...form, isPaid: false })}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${!form.isPaid ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                Bepul
              </button>
              <button type="button" onClick={() => setForm({ ...form, isPaid: true })}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${form.isPaid ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                Pullik
              </button>
            </div>
          </div>
          {form.isPaid && (
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Narx (so'm) *</label>
              <input className="input max-w-48" type="number" placeholder="25000"
                value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
        {success && <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl">✅ Muvaffaqiyatli yuklandi!</div>}

        <button type="submit" disabled={loading}
          className="btn-primary w-full py-3 text-base disabled:opacity-60">
          {loading ? `Yuklanmoqda... ${progress}%` : `${kind === 'darslik' ? 'Darslik' : 'Test'}ni yuklash`}
        </button>
      </form>
    </div>
  )
}
