# MedBase — Firebase + Cloudinary + Vercel
# 100% BEPUL — karta, upgrade kerak emas!

---

## 1-QADAM: Firebase sozlash

### 1.1 — Authentication yoqish
1. console.firebase.google.com → loyihangiz
2. Chap menyu → **Authentication** → **"Get started"**
3. **"Email/Password"** → **Enable** qilib **Save** bosing

### 1.2 — Firestore yaratish (BEPUL)
1. Chap menyu → **Firestore Database** → **"Create database"**
2. **"Start in test mode"** tanlang → **Next**
3. Region: **europe-west3** → **Enable**

> ⚠️ **Storage bo'limini OCHMANG** — u pullik. Biz Cloudinary ishlatamiz!

### 1.3 — Firestore Rules sozlash
Firestore → **Rules** tabiga o'ting va quyidagini joylashtiring:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }

    match /files/{fileId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'approved';
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /payments/{paymentId} {
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

**Publish** tugmasini bosing.

### 1.4 — Admin foydalanuvchi yaratish
1. Firebase → **Authentication** → **Users** → **"Add user"**
2. Email va parol kiriting
3. Yaratilgan foydalanuvchining **UID** sini nusxa oling
4. **Firestore** → **Data** → **"+ Start collection"**
   - Collection ID: `users` → **Next**
   - Document ID: (UID ni joylashtiring)
   - Quyidagi fieldlarni qo'shing:

```
fullName   →  string  →  "Dr. Admin Adminov"
email      →  string  →  "admin@tibbiyot.uz"
role       →  string  →  "admin"
status     →  string  →  "approved"
faculty    →  string  →  ""
year       →  string  →  ""
groupName  →  string  →  ""
```

**Save** bosing ✅

---

## 2-QADAM: Cloudinary sozlash

### 2.1 — Upload Preset yaratish
1. cloudinary.com ga kiring (allaqachon ro'yxatdan o'tgansiz)
2. Yuqori o'ng → **Settings** (⚙️)
3. **Upload** tab → **"Add upload preset"**
4. Quyidagilarni to'ldiring:
   - Preset name: `medbase`
   - Signing mode: **Unsigned**
5. **Save** bosing ✅

Bu qadamni bajarmасангиз ham bo'ladi — kodimiz server-side upload ishlatadi (API Secret orqali), preset shart emas.

---

## 3-QADAM: Kodni ishga tushirish

```bash
# 1. Papkaga kiring
cd medbase-cloudinary

# 2. Paketlarni o'rnating
npm install

# 3. .env.local faylini oching va karta ma'lumotlarini o'zgartiring:
# NEXT_PUBLIC_CARD_NUMBER=8600 XXXX XXXX XXXX
# NEXT_PUBLIC_CARD_HOLDER=ISM FAMILIYA
# NEXT_PUBLIC_CARD_BANK=Xalq banki

# 4. Local ishga tushiring
npm run dev

# 5. Brauzerda oching:
# http://localhost:3000
```

---

## 4-QADAM: GitHub ga yuklash

```bash
git init
git add .
git commit -m "MedBase initial commit"
git remote add origin https://github.com/SIZNING/medbase.git
git branch -M main
git push -u origin main
```

---

## 5-QADAM: Vercel deploy

1. vercel.com → **New Project** → GitHub repo tanlang
2. **Environment Variables** ga quyidagilarni kiriting:

```
NEXT_PUBLIC_FIREBASE_API_KEY              = AIzaSyDEH2ncidSPVwzhpzTAiocDkZjUuVd-2Ig
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN          = medbase-8f2e5.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID           = medbase-8f2e5
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET       = medbase-8f2e5.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID  = 125799856152
NEXT_PUBLIC_FIREBASE_APP_ID               = 1:125799856152:web:00cbdd72629bd4ca82ab6d
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME         = dvxofmzqi
CLOUDINARY_API_KEY                        = 946287155658639
CLOUDINARY_API_SECRET                     = G9i52o57rZYEX-rSsyMKWAiqRf4
NEXT_PUBLIC_CARD_NUMBER                   = 8600 XXXX XXXX XXXX
NEXT_PUBLIC_CARD_HOLDER                   = ISM FAMILIYA
NEXT_PUBLIC_CARD_BANK                     = Xalq banki
```

3. **Deploy** → 2 daqiqa → ✅ Sayt tayyor!

---

## ARXITEKTURA (100% BEPUL)

```
Firebase Auth     → Login, Register, Email tasdiqlash   BEPUL ✅
Firebase Firestore → Foydalanuvchilar, Fayllar, To'lovlar  BEPUL ✅
Cloudinary        → PDF, DOCX, Chek rasmlari saqlash    BEPUL ✅
Vercel            → Hosting                             BEPUL ✅
```

> ⚠️ Firebase Storage ISHLATILMAGAN — upgrade kerak emas!

---

## MUAMMOLAR

**"permission-denied"** → Firestore Rules ni tekshiring

**"Firebase: Error (auth/...)"** → Authentication → Email/Password yoqilganini tekshiring

**Fayl yuklanmaydi** → Cloudinary API key/secret to'g'ri kiritilganini tekshiring

**Build xatosi Vercel da** → Environment Variables to'liq kiritilganini tekshiring
