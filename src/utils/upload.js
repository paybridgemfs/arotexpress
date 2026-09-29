/**
 * Uploads an image file or base64 directly to Google Drive via server-side API.
 * 
 * Returns:
 * - If returnDetails is true: { url: string, delete_url: string | null, display_url: string, thumb_url: string | null }
 * - Otherwise: url string (for backward compatibility)
 */
export async function uploadImage(fileOrData, optionalAdminToken = null, returnDetails = false) {
  if (!fileOrData) return null;

  // If already an online URL (http/https), return directly without re-uploading
  if (typeof fileOrData === 'string' && (fileOrData.startsWith('http://') || fileOrData.startsWith('https://'))) {
    return returnDetails ? { url: fileOrData, delete_url: null, display_url: fileOrData, thumb_url: null } : fileOrData;
  }

  // Get Admin token from parameters or localStorage
  let token = optionalAdminToken;
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('arot_admin_token');
  }

  const authHeaders = {};
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }

  let driveRes;
  try {
    if (fileOrData instanceof File || fileOrData instanceof Blob) {
      const formData = new FormData();
      formData.append('image', fileOrData);
      driveRes = await fetch('/api/gdrive/upload', {
        method: 'POST',
        headers: authHeaders,
        body: formData
      });
    } else if (typeof fileOrData === 'string') {
      driveRes = await fetch('/api/gdrive/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({ image: fileOrData })
      });
    }
  } catch (netErr) {
    console.error('Google Drive network error:', netErr);
    throw new Error('সার্ভারের সাথে সংযোগ করা যায়নি। আপনার ইন্টারনেট কানেকশন চেক করুন।');
  }

  if (driveRes) {
    const driveJson = await driveRes.json().catch(() => ({}));

    if (driveRes.ok && driveJson.url) {
      if (returnDetails) {
        return {
          url: driveJson.url,
          delete_url: driveJson.delete_url || `gdrive:${driveJson.file_id || ''}`,
          display_url: driveJson.display_url || driveJson.url,
          thumb_url: driveJson.url
        };
      }
      return driveJson.url;
    }

    if (driveJson.error) {
      throw new Error(driveJson.error);
    }
  }

  throw new Error('ছবি আপলোড করতে ব্যর্থ হয়েছে। দয়া করে অ্যাডমিন প্যানেলের "গুগল ড্রাইভ" ট্যাব থেকে গুগল একাউন্ট যুক্ত বা রিকানেক্ট করুন।');
}

/**
 * Deletes an image from Google Drive
 */
export async function deleteImage(deleteUrl, optionalAdminToken = null) {
  if (!deleteUrl || typeof deleteUrl !== 'string') return;

  try {
    let token = optionalAdminToken;
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('arot_admin_token');
    }

    const authHeaders = {
      'Content-Type': 'application/json'
    };
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }

    await fetch('/api/gdrive/delete', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ delete_url: deleteUrl })
    });
  } catch (e) {
    console.warn('Google Drive image deletion error:', e);
  }
}
