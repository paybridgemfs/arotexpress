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
      const customName = incomingForm.get('name') || incomingForm.get('custom_name') || incomingForm.get('fileName') || incomingForm.get('product_name');

      if (!file) {
        return NextResponse.json(
          { error: 'কোনো ইমেজ ফাইল পাওয়া যায়নি।' },
          { status: 400 }
        );
      }

      const rawFileName = (typeof customName === 'string' && customName.trim()) ? customName.trim() : (file.name || `img_${Date.now()}`);
      fileName = rawFileName;
      mimeType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);

      const isProfilePic = incomingForm.get('type') === 'profile' || rawFileName.startsWith('user_') || rawFileName.includes('profile');
      if (isProfilePic && buffer.length > 1 * 1024 * 1024) {
        return NextResponse.json({ error: 'প্রোফাইল ছবির সাইজ সর্বোচ্চ ১ মেগাবাইট (1MB) হতে পারবে।' }, { status: 400 });
      }
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
        else if (meta.includes('image/svg')) mimeType = 'image/svg+xml';
        else if (meta.includes('icon') || meta.includes('ico')) mimeType = 'image/x-icon';
        else mimeType = 'image/jpeg';
      }

      const customName = body.name || body.custom_name || body.fileName || body.product_name;
      if (customName && typeof customName === 'string') {
        fileName = customName.trim();
      }
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
