import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  const name = req.nextUrl.searchParams.get('name') || 'fayl'

  if (!url) {
    return NextResponse.json({ error: 'URL kerak' }, { status: 400 })
  }

  try {
    // Cloudinary URL ni fl_attachment bilan o'zgartirish
    // Bu Cloudinary ga yuklab olish rejimida yuborish deydi
    let downloadUrl = url

    if (url.includes('cloudinary.com')) {
      // /upload/ dan keyin fl_attachment/ qo'shamiz
      downloadUrl = url.replace('/upload/', '/upload/fl_attachment/')
    }

    // Faylni serverdan olib, foydalanuvchiga yuboramiz
    const response = await fetch(downloadUrl)
    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Yuklab olishda xato' }, { status: 500 })
  }
}
