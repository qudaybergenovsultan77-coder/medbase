import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file) {
      return NextResponse.json({ error: 'Fayl topilmadi' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Rasm yoki PDF — image yoki raw
    const isImage = file.type.startsWith('image/')
    const resourceType = isImage ? 'image' : 'raw'

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `medbase/cheks/${userId}`,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    return NextResponse.json({
      success: true,
      url: result.secure_url,       // Ko'rsatish uchun URL
      publicId: result.public_id,
      resourceType,
    })
  } catch (error: any) {
    console.error('Chek upload error:', error)
    return NextResponse.json(
      { error: 'Chek yuklashda xato: ' + (error.message || 'Noma\'lum xato') },
      { status: 500 }
    )
  }
}
