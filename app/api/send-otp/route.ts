import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, fullName, otp } = await req.json()

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email va OTP kerak' }, { status: 400 })
    }

    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY sozlanmagan' }, { status: 500 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MedBase <onboarding@resend.dev>',
        to: [email],
        subject: 'MedBase — Email tasdiqlash kodi',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <div style="background: #185FA5; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">MedBase</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Tibbiyot universiteti platformasi</p>
            </div>
            
            <p style="color: #374151; font-size: 15px;">Assalomu alaykum, <strong>${fullName}</strong>!</p>
            <p style="color: #6B7280; font-size: 14px;">MedBase ga ro'yxatdan o'tganingiz uchun rahmat. Email manzilingizni tasdiqlash uchun quyidagi kodni kiriting:</p>
            
            <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <p style="color: #6B7280; font-size: 13px; margin: 0 0 8px;">Tasdiqlash kodi</p>
              <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #185FA5;">${otp}</div>
              <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0 0;">Kod 10 daqiqa davomida amal qiladi</p>
            </div>
            
            <p style="color: #9CA3AF; font-size: 12px;">Agar siz ro'yxatdan o'tgan bo'lmasangiz, bu xatni e'tiborsiz qoldiring.</p>
            
            <div style="border-top: 1px solid #E5E7EB; margin-top: 24px; padding-top: 16px; text-align: center;">
              <p style="color: #9CA3AF; font-size: 11px; margin: 0;">© 2025 MedBase. Barcha huquqlar himoyalangan.</p>
            </div>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('Resend error:', err)
      return NextResponse.json({ error: 'Email yuborishda xato' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
