export type Role = 'admin' | 'student'
export type Status = 'pending' | 'approved' | 'rejected'
export type Lang = 'uz' | 'ru' | 'en'
export type Kind = 'darslik' | 'test'
export type PaymentStatus = 'pending' | 'confirmed' | 'rejected'

export interface MedFile {
  id: string
  kind: Kind
  name: string
  description?: string
  subject: string
  year: string
  lang: Lang
  price: number
  isPaid: boolean
  filePath: string
  fileSize?: string
  qCount?: number
  uploadedBy?: string
  createdAt?: any
}

export interface Payment {
  id: string
  userId: string
  fileId: string
  amount: number
  chekPath: string
  chekName: string
  status: PaymentStatus
  userName?: string
  fileName?: string
  createdAt?: any
  reviewedAt?: any
}

export const SUBJECTS = [
  'Anatomiya', 'Fiziologiya', 'Biokimyo', 'Patologiya',
  'Farmakologiya', 'Mikrobiologiya', 'Gistologiya', 'Jarrohlik',
  'Terapiya', 'Ginekologiya', 'Pediatriya', 'Nevrologiya',
  'Oftalmologiya', 'Dermatologiya', 'Immunologiya'
]

export const YEARS = ['1-kurs', '2-kurs', '3-kurs', '4-kurs', '5-kurs', '6-kurs']

export const FACULTIES = [
  'Davolash', 'Pediatriya', 'Stomatologiya',
  'Tibbiy-profilaktika', 'Farmatsevtika'
]

export const LANG_INFO: Record<Lang, { flag: string; label: string }> = {
  uz: { flag: '🇺🇿', label: "O'zbekcha" },
  ru: { flag: '🇷🇺', label: 'Русский' },
  en: { flag: '🇬🇧', label: 'English' },
}
