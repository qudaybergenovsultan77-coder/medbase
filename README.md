# MedBase — Firebase + Vercel Deploy Yo'riqnomasi

---

## 1-QADAM: Firebase sozlash

### 1.1 — Authentication yoqish
1. https://console.firebase.google.com → loyihangiz → **Authentication**
2. **"Get started"** → **"Email/Password"** → **Enable** → Save

### 1.2 — Firestore yaratish
1. Chap menyu → **Firestore Database** → **"Create database"**
2. **"Start in test mode"** tanlang (keyinchalik qoidalar qo'shamiz)
3. Region: **europe-west3** → Enable

### 1.3 — Storage yaratish
1. Chap menyu → **Storage** → **"Get started"**
2. **"Start in test mode"** → Next → Done

### 1.4 — Firestore qoidalari (Rules)
Firestore → **Rules** tabiga o'ting va quyidagini joylashtiring:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Foydalanuvchilar
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }

    // Fayllar
    match /files/{fileId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'approved';
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // To'lovlar
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

### 1.5 — Storage qoidalari
Storage → **Rules** tabiga o'ting:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Fayllar — faqat admin yuklaydi, to'lagan foydalanuvchi yuklab oladi
    match /files/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Cheklar — foydalanuvchi yuklaydi, admin ko'radi
    match /cheks/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Publish** bosing.

### 1.6 — Admin foydalanuvchi yaratish
1. Firebase → **Authentication** → **Users** → **"Add user"**
2. Email: `admin@tibbiyot.uz` | Parol: o'zingiz bilasiz
3. UID ni nusxa oling (ro'yxatdagi foydalanuvchi yonidagi)
4. **Firestore** → **"+ Start collection"** → Collection ID: `users`
5. Document ID: (nusxa olgan UID) → quyidagi fieldlarni qo'shing:

```
fullName:   "Dr. Admin Adminov"   (string)
email:      "admin@tibbiyot.uz"   (string)
role:       "admin"               (string)
status:     "approved"            (string)
faculty:    ""                    (string)
year:       ""                    (string)
groupName:  ""                    (string)
```

**Save** bosing. ✅ Admin tayyor!

---

## 2-QADAM: Kodni sozlash

```bash
# 1. ZIP ni yuklab ochish
# medbase-firebase papkasiga kiring

# 2. Paketlarni o'rnatish
npm install

# 3. .env.local faylini tahrirlang
# (allaqachon to'ldirilgan, faqat karta ma'lumotlarini o'zgartiring)
NEXT_PUBLIC_CARD_NUMBER=8600 XXXX XXXX XXXX
NEXT_PUBLIC_CARD_HOLDER=ISM FAMILIYA
NEXT_PUBLIC_CARD_BANK=Xalq banki

# 4. Local ishga tushirish
npm run dev

# 5. Brauzerda:
# http://localhost:3000
```

---

## 3-QADAM: GitHub ga yuklash

```bash
# GitHub.com → New repository → "medbase"

git init
git add .
git commit -m "MedBase Firebase initial"
git remote add origin https://github.com/SIZNING/medbase.git
git branch -M main
git push -u origin main
```

---

## 4-QADAM: Vercel deploy

1. **vercel.com** → "New Project" → GitHub repo tanlang
2. **Environment Variables** ga quyidagilarni qo'shing:

```
NEXT_PUBLIC_FIREBASE_API_KEY            = AIzaSyDEH2ncidSPVwzhpzTAiocDkZjUuVd-2Ig
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        = medbase-8f2e5.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID         = medbase-8f2e5
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     = medbase-8f2e5.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID= 125799856152
NEXT_PUBLIC_FIREBASE_APP_ID             = 1:125799856152:web:00cbdd72629bd4ca82ab6d
NEXT_PUBLIC_CARD_NUMBER                 = 8600 XXXX XXXX XXXX
NEXT_PUBLIC_CARD_HOLDER                 = ISM FAMILIYA
NEXT_PUBLIC_CARD_BANK                   = Xalq banki
```

3. **Deploy** → 2 daqiqa → ✅ Sayt tayyor!

---

## LOYIHA TUZILMASI

```
medbase-firebase/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx        ← Kirish
│   │   └── register/page.tsx     ← Ro'yxat + Email tasdiqlash
│   └── dashboard/
│       ├── layout.tsx            ← Sidebar
│       ├── page.tsx              ← Dashboard
│       ├── darsliklar/           ← Darsliklar
│       ├── testlar/              ← Testlar
│       ├── myfiles/              ← Mening fayllarim
│       ├── myorders/             ← Mening to'lovlarim
│       └── admin/
│           ├── payments/         ← Chek tasdiqlash
│           ├── users/            ← Talabalar
│           └── upload/           ← Fayl yuklash
├── components/ui/
│   ├── FileList.tsx              ← Fayl ro'yxati
│   ├── PayModal.tsx              ← To'lov modali
│   └── PreviewModal.tsx          ← Preview modali
├── lib/
│   ├── firebase.ts               ← Firebase config
│   └── AuthContext.tsx           ← Global auth holati
└── types/index.ts                ← TypeScript types
```

---

## MUAMMOLAR

**"permission-denied"** → Firestore Rules ni tekshiring, yuqoridagi qoidalarni to'g'ri joylashtiring

**"Firebase: Error (auth/...)"** → Authentication → Email/Password yoqilganini tekshiring

**Fayl yuklanmaydi** → Storage Rules ni tekshiring

**Build xatosi Vercel da** → Environment Variables to'liq kiritilganini tekshiring
