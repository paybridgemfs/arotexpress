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

  // 1. First attempt: Server-Side Google Drive Upload
  try {
    let driveRes;
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

    if (driveRes) {
      const driveJson = await driveRes.json();
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
      } else if (driveJson.error && driveJson.error.includes('কানেক্ট করা নেই')) {
        throw new Error(driveJson.error);
      }
    }
  } catch (gdriveErr) {
    console.warn('Google Drive direct upload notice:', gdriveErr.message);
    if (gdriveErr.message && gdriveErr.message.includes('কানেক্ট')) {
      throw gdriveErr;
    }
  }

  // Fallback: Ephemeral ticket upload if GDrive not yet configured
  try {
    const ticketRes = await fetch('/api/upload/ticket', {
      method: 'POST',
      headers: authHeaders
    });

    const ticketData = await ticketRes.json();
    if (ticketRes.ok && ticketData.ticket) {
      const burnRes = await fetch(`/api/upload/ticket?ticket=${encodeURIComponent(ticketData.ticket)}`, {
        headers: authHeaders
      });
      const burnData = await burnRes.json();
      if (burnRes.ok && burnData.apiKey) {
        const apiKey = burnData.apiKey;
        const formData = new FormData();
        if (fileOrData instanceof File || fileOrData instanceof Blob) {
          formData.append('image', fileOrData);
        } else if (typeof fileOrData === 'string') {
          let cleanBase64 = fileOrData;
          if (cleanBase64.includes('base64,')) {
            cleanBase64 = cleanBase64.split('base64,')[1];
          }
          formData.append('image', cleanBase64);
        }

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          body: formData
        });

        const resText = await response.text();
        const jsonRes = JSON.parse(resText);
        if (response.ok && jsonRes.success) {
          const directUrl = jsonRes.data?.url || jsonRes.data?.display_url;
          const deleteUrl = jsonRes.data?.delete_url || null;
          if (returnDetails) {
            return {
              url: directUrl,
              delete_url: deleteUrl,
              display_url: jsonRes.data?.display_url || directUrl,
              thumb_url: jsonRes.data?.thumb?.url || null
            };
          }
          return directUrl;
        }
      }
    }
  } catch (fallbackErr) {
    console.warn('Fallback upload error:', fallbackErr);
  }

  throw new Error('ছবি আপলোড করতে ব্যর্থ হয়েছে। দয়া করে অ্যাডমিন প্যানেলের "গুগল ড্রাইভ" ট্যাব থেকে গুগল একাউন্ট লগইন/কানেক্ট আছে কিনা চেক করুন।');
}

/**
 * Deletes an image from Google Drive or legacy ImgBB
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

    // Check if it's a Google Drive delete URL or file ID or googleusercontent URL
    if (
      deleteUrl.startsWith('gdrive:') ||
      deleteUrl.includes('googleusercontent.com') ||
      deleteUrl.includes('drive.google.com') ||
      /^[a-zA-Z0-9_-]{25,45}$/.test(deleteUrl.trim())
    ) {
      await fetch('/api/gdrive/delete', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ delete_url: deleteUrl })
      });
      return;
    }

    // Otherwise use legacy ImgBB delete endpoint
    await fetch('/api/upload/delete', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ delete_url: deleteUrl })
    });
  } catch (e) {
    console.warn('Image deletion request error:', e);
  }
}
