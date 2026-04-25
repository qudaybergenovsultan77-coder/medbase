'use client'
import { useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, sendEmailVerification, deleteUser } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FACULTIES, YEARS } from '@/types'

type Step = 1 | 2 | 3

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    faculty: FACULTIES[0], year: YEARS[0], groupName: ''
  })
  const [tempUser, setTempUser] = useState<any>(null)
  const [checkingVerify, setCheckingVerify] = useState(false)

  // 1-qadam: Ma'lumotlar + Firebase ga yozish
  async function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.fullName || !form.email || !form.password || !form.groupName) {
      setError('Barcha maydonlarni to\'ldiring')
      return
    }
    if (form.password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lsin')
      return
    }
    setLoading(true)

    try {
      // Firebase Auth da foydalanuvchi yaratish
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password)

      // Email tasdiqlash xati yuborish
      await sendEmailVerification(user)

      // Firestore ga yozish (status: pending)
      await setDoc(doc(db, 'users', user.uid), {
        fullName: form.fullName,
        email: form.email,
        role: 'student',
        faculty: form.faculty,
        year: form.year,
        groupName: form.groupName,
        status: 'pending',
        emailVerified: false,
        createdAt: serverTimestamp()
      })

      setTempUser(user)
      setStep(2)
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Bu email allaqachon ro\'yxatdan o\'tgan')
      } else {
        setError('Xato: ' + err.message)
      }
    }
    setLoading(false)
  }

  // 2-qadam: Email tasdiqlashini tekshirish
  async function checkEmailVerified() {
    setCheckingVerify(true)
    setError('')
    try {
      await tempUser.reload()
      if (tempUser.emailVerified) {
        // Firestore da emailVerified ni yangilash
        await setDoc(doc(db, 'users', tempUser.uid), { emailVerified: true }, { merge: true })
        await auth.signOut() // Chiqish — admin tasdiqlaguncha
        setStep(3)
      } else {
        setError('Email hali tasdiqlanmagan. Pochtangizni tekshiring va havolani bosing.')
      }
    } catch (err: any) {
      setError('Xato: ' + err.message)
    }
    setCheckingVerify(false)
  }

  async function resendEmail() {
    try {
      await sendEmailVerification(tempUser)
      setError('')
      alert('Xat qayta yuborildi!')
    } catch {
      setError('Qayta yuborishda xato. Biroz kutib urinib ko\'ring.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
          <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 22 22">
              <rect x="8" y="1" width="6" height="20" rx="2" fill="white"/>
              <rect x="1" y="8" width="20" height="6" rx="2" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">MedBase</div>
            <div className="text-xs text-gray-400">Tibbiyot universiteti platformasi</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-100 mb-6">
          <Link href="/auth/login" className="pb-3 text-sm text-gray-400 hover:text-gray-600">Kirish</Link>
          <span className="pb-3 text-sm font-medium text-blue-700 border-b-2 border-blue-700">Ro'yxatdan o'tish</span>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium
                ${step === s ? 'bg-blue-700 text-white' : step > s ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`h-0.5 w-8 ${step > s ? 'bg-emerald-400' : 'bg-gray-100'}`} />}
            </div>
          ))}
          <span className="text-xs text-gray-400 ml-1">
            {step === 1 ? 'Ma\'lumotlar' : step === 2 ? 'Email tasdiqlash' : 'Tayyor!'}
          </span>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">To'liq ism familiya</label>
              <input className="input" placeholder="Ism Familiya" value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Elektron pochta</label>
              <input className="input" type="email" placeholder="ism@tibbiyot.uz" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Parol</label>
              <input className="input" type="password" placeholder="Kamida 6 belgi" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Fakultet</label>
                <select className="input" value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })}>
                  {FACULTIES.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Kurs</label>
                <select className="input" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
                  {YEARS.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">Guruh raqami</label>
              <input className="input" placeholder="DA-22-01" value={form.groupName}
                onChange={e => setForm({ ...form, groupName: e.target.value })} />
            </div>
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-1">
              {loading ? 'Yuborilmoqda...' : 'Davom etish →'}
            </button>
          </form>
        )}

        {/* STEP 2 — Email verify */}
        {step === 2 && (
          <div className="text-center">
            <div className="text-4xl mb-3">📧</div>
            <h2 className="text-base font-semibold mb-2">Emailingizni tasdiqlang</h2>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              <strong>{form.email}</strong> manziliga tasdiqlash xati yuborildi.<br />
              Pochtangizni oching va havolani bosing.
            </p>
            <div className="bg-blue-50 rounded-xl p-4 mb-5 text-left">
              <div className="text-xs text-blue-700 leading-relaxed">
                📌 Xat <strong>Spam</strong> papkasiga tushgan bo'lishi mumkin — tekshiring!
              </div>
            </div>
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
            <button onClick={checkEmailVerified} disabled={checkingVerify} className="btn-primary w-full py-2.5 mb-3">
              {checkingVerify ? 'Tekshirilmoqda...' : 'Tasdiqladim ✓'}
            </button>
            <button onClick={resendEmail} className="text-sm text-blue-700 hover:underline">
              Xat kelmadimi? Qayta yuborish
            </button>
          </div>
        )}

        {/* STEP 3 — Success */}
        {step === 3 && (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-base font-semibold mb-2">Email tasdiqlandi!</h2>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-left">
              <div className="flex gap-3">
                <span className="text-xl">⏳</span>
                <div className="text-sm text-amber-700 leading-relaxed">
                  Hisobingiz yaratildi. Admin ko'rib chiqib tasdiqlaydi.
                  Bu odatda <strong>1–24 soat</strong> ichida bo'ladi.
                </div>
              </div>
            </div>
            <Link href="/auth/login" className="btn-primary inline-block py-2.5 px-8">
              Kirish sahifasiga →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
