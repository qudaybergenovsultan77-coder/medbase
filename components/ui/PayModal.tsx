'use client'
import { useState, useRef } from 'react'
import { db, storage } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuth } from '@/lib/AuthContext'
import { MedFile } from '@/types'

interface Props {
  file: MedFile
  onClose: () => void
  onSuccess: () => void
}

export default function PayModal({ file, onClose, onSuccess }: Props) {
  const { profile } = useAuth()
  const [chekFile, setChekFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const cardNumber = process.env.NEXT_PUBLIC_CARD_NUMBER || '8600 0000 0000 0000'
  const cardHolder = process.env.NEXT_PUBLIC_CARD_HOLDER || 'ADMIN'
  const cardBank = process.env.NEXT_PUBLIC_CARD_BANK || 'Bank'

  function copyCard() {
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit() {
    if (!chekFile) { setError('Iltimos chek rasmini yuklang'); return }
    if (!profile) return
    setLoading(true)
    setError('')

    try {
      // Avval tekshirish — bu fayl uchun to'lov bor-yo'qmi
      const existing = await getDocs(query(
        collection(db, 'payments'),
        where('userId', '==', profile.uid),
        where('fileId', '==', file.id)
      ))
      const active = existing.docs.find(d => d.data().status !== 'rejected')
      if (active) {
        setError('Bu resurs uchun to\'lov allaqachon yuborilgan')
        setLoading(false)
        return
      }

      // 1. Chekni Firebase Storage ga yuklash
      const ext = chekFile.name.split('.').pop()
      const chekPath = `cheks/${profile.uid}/${file.id}_${Date.now()}.${ext}`
      const storageRef = ref(storage, chekPath)
      await uploadBytes(storageRef, chekFile)

      // 2. Firestore ga to'lov yozish
      await addDoc(collection(db, 'payments'), {
        userId: profile.uid,
        userName: profile.fullName,
        userEmail: profile.email,
        fileId: file.id,
        fileName: file.name,
        amount: file.price,
        chekPath,
        chekName: chekFile.name,
        status: 'pending',
        createdAt: serverTimestamp(),
      })

      onSuccess()
    } catch (err: any) {
      setError('Xato: ' + (err.message || 'Noma\'lum xato'))
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">

          {/* Fayl info */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">{file.kind === 'darslik' ? '📘' : '📝'}</span>
            <div>
              <div className="text-base font-semibold text-gray-900">{file.name}</div>
              <div className="text-xs text-gray-400">{file.subject} · {file.year}</div>
            </div>
          </div>

          {/* Karta */}
          <div className="relative bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-5 mb-4 text-white overflow-hidden">
            <div className="text-xs opacity-60 mb-2 font-medium tracking-wide">{cardBank.toUpperCase()} · HUMO / UZCARD</div>
            <div className="text-xl font-mono font-medium tracking-widest mb-3">{cardNumber}</div>
            <div className="text-sm opacity-80">{cardHolder}</div>
            <button onClick={copyCard}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
              {copied ? '✓ Nusxalandi' : 'Nusxa olish'}
            </button>
          </div>

          {/* Summa */}
          <div className="bg-emerald-50 rounded-xl p-4 mb-4">
            <div className="text-xs text-gray-500 mb-1">To'lov miqdori</div>
            <div className="text-2xl font-semibold text-emerald-700">{file.price.toLocaleString()} so'm</div>
          </div>

          {/* Ko'rsatma */}
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <div className="flex gap-3">
              <span className="text-xl flex-shrink-0">📋</span>
              <div className="text-sm text-blue-700 space-y-1 leading-relaxed">
                <div>1. Yuqoridagi kartaga <strong>{file.price.toLocaleString()} so'm</strong> o'tkazing</div>
                <div>2. To'lov cheki (screenshot) ni quyida yuklang</div>
                <div>3. Admin 1–24 soat ichida tekshirib tasdiqlaydi</div>
                <div>4. Tasdiqlangach fayl avtomatik ochiladi ✅</div>
              </div>
            </div>
          </div>

          {/* Chek yuklash */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2 font-medium">To'lov chekini yuklang</label>
            <div
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors
                ${chekFile ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-blue-300'}`}>
              {chekFile ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-emerald-700">{chekFile.name}</div>
                    <div className="text-xs text-emerald-500">O'zgartirish uchun bosing</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-2">🖼️</div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Chek rasmini yuklang</div>
                  <div className="text-xs text-gray-400">PNG, JPG, PDF — 5 MB gacha</div>
                </div>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden"
              onChange={e => e.target.files?.[0] && setChekFile(e.target.files[0])} />
            <div className="text-xs text-gray-400 mt-1.5">
              💡 Xalq banki, Payme, Click ilovangizdan chek screenshotini yuklang
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 btn-secondary py-2.5">Bekor qilish</button>
            <button onClick={handleSubmit} disabled={!chekFile || loading}
              className="flex-1 btn-primary py-2.5">
              {loading ? 'Yuborilmoqda...' : 'Chek yuborish →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
