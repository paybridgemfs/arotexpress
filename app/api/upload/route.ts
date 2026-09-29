import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/app/lib/auth';
import { uploadImageBufferToDrive } from '@/app/lib/gdrive';

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateToken(req);
    if (authResult.error || (authResult.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'শুধুমাত্র অ্যাডমিন ছবি আপলোড করতে পারবেন।' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    let buffer: Buffer;
    let fileName = `arot_${Date.now()}.jpg`;
    let mimeType = 'image/jpeg';

    if (contentType.includes('multipart/form-data')) {
      const incomingForm = await req.formData();
      const file = incomingForm.get('image') as File | null;

      if (!file) {
        return NextResponse.json(
          { error: 'কোনো ইমেজ ফাইল পাওয়া যায়নি।' },
          { status: 400 }
        );
      }

      fileName = file.name || `img_${Date.now()}.jpg`;
      mimeType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      const body = await req.json().catch(() => ({}));
      const rawImage = body.image || body.base64;
      if (!rawImage || typeof rawImage !== 'string') {
        return NextResponse.json(
          { error: 'কোনো ইমেজ ডাটা পাওয়া যায়নি।' },
          { status: 400 }
        );
      }

      let base64Data = rawImage;
      if (rawImage.includes('base64,')) {
        const parts = rawImage.split('base64,');
        const meta = parts[0];
        base64Data = parts[1];
        if (meta.includes('image/png')) mimeType = 'image/png';
        else if (meta.includes('image/webp')) mimeType = 'image/webp';
        else if (meta.includes('image/gif')) mimeType = 'image/gif';
        else mimeType = 'image/jpeg';
      }

      if (body.fileName) fileName = body.fileName;
      buffer = Buffer.from(base64Data, 'base64');
    }

    const uploadResult = await uploadImageBufferToDrive(buffer, fileName, mimeType);

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      display_url: uploadResult.display_url,
      thumb_url: uploadResult.url,
      delete_url: uploadResult.delete_url,
      file_id: uploadResult.file_id
    });
  } catch (err: any) {
    console.error('Upload Error:', err);
    return NextResponse.json(
      { error: err.message || 'গুগল ড্রাইভে ছবি আপলোড করতে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}
