'use client'
import { useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)

      // Firestore dan profile tekshirish
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (!snap.exists()) {
        await auth.signOut()
        setError('Profil topilmadi. Admin bilan bog\'laning.')
        setLoading(false)
        return
      }

      const profile = snap.data()

      if (profile.status === 'pending') {
        await auth.signOut()
        setError('Hisobingiz admin tomonidan tasdiqlanmagan. Iltimos, kuting.')
        setLoading(false)
        return
      }

      if (profile.status === 'rejected') {
        await auth.signOut()
        setError('Hisobingiz bloklangan. Admin bilan bog\'laning.')
        setLoading(false)
        return
      }

      router.replace('/dashboard')
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Email yoki parol noto\'g\'ri')
      } else if (err.code === 'auth/user-not-found') {
        setError('Bu email ro\'yxatdan o\'tmagan')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Juda ko\'p urinish. Biroz kutib qayta urining.')
      } else {
        setError('Xato yuz berdi: ' + err.message)
      }
      setLoading(false)
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
          <span className="pb-3 text-sm font-medium text-blue-700 border-b-2 border-blue-700">Kirish</span>
          <Link href="/auth/register" className="pb-3 text-sm text-gray-400 hover:text-gray-600">
            Ro'yxatdan o'tish
          </Link>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Elektron pochta</label>
            <input className="input" type="email" placeholder="ism@tibbiyot.uz"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Parol</label>
            <input className="input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Kirilmoqda...' : 'Kirish'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Hisob yo'qmi?{' '}
          <Link href="/auth/register" className="text-blue-700 hover:underline">
            Ro'yxatdan o'ting
          </Link>
        </p>
      </div>
    </div>
  )
}
