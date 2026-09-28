import { NextRequest, NextResponse } from 'next/server';
import { uploadImageBufferToDrive } from '../../../lib/gdrive';
import { authenticateToken } from '../../../lib/auth';

export async function POST(req: NextRequest) {
  const auth = await authenticateToken(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const contentType = req.headers.get('content-type') || '';

    let buffer: Buffer;
    let fileName = `arot_${Date.now()}.jpg`;
    let mimeType = 'image/jpeg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image') || formData.get('file');

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: 'কোনো ইমেজ ফাইল পাওয়া যায়নি' }, { status: 400 });
      }

      fileName = (file as any).name || `img_${Date.now()}.jpg`;
      mimeType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // JSON body with base64
      const body = await req.json().catch(() => ({}));
      const rawImage = body.image || body.base64;
      if (!rawImage || typeof rawImage !== 'string') {
        return NextResponse.json({ error: 'সঠিক ইমেজ ডাটা প্রদান করুন' }, { status: 400 });
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
      delete_url: uploadResult.delete_url,
      file_id: uploadResult.file_id,
      name: uploadResult.name
    });
  } catch (err: any) {
    console.error('Error in GDrive upload route:', err);
    return NextResponse.json(
      { error: err.message || 'গুগল ড্রাইভে ছবি আপলোড করতে ব্যর্থ হয়েছে' },
      { status: 500 }
    );
  }
}
