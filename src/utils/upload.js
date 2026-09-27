/**
 * Uploads an image file or base64 directly from the client's browser to ImgBB.
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

  // Step 1: Request a secure ephemeral upload ticket from the backend
  const ticketRes = await fetch('/api/upload/ticket', {
    method: 'POST',
    headers: authHeaders
  });

  const ticketData = await ticketRes.json();
  if (!ticketRes.ok || !ticketData.ticket) {
    throw new Error(ticketData.error || 'ইমেজ আপলোড অনুমোদনে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।');
  }

  // Step 2: Trade the single-use ticket in memory to get the key right before sending to ImgBB
  const burnRes = await fetch(`/api/upload/ticket?ticket=${encodeURIComponent(ticketData.ticket)}`, {
    headers: authHeaders
  });
  const burnData = await burnRes.json();
  if (!burnRes.ok || !burnData.apiKey) {
    throw new Error(burnData.error || 'আপলোড সেশন শেষ হয়ে গেছে। আবার চেষ্টা করুন।');
  }

  const apiKey = burnData.apiKey;

  // Step 3: Direct Client-Side upload to ImgBB from user's browser
  const formData = new FormData();

  if (fileOrData instanceof File || fileOrData instanceof Blob) {
    formData.append('image', fileOrData);
  } else if (typeof fileOrData === 'string') {
    let cleanBase64 = fileOrData;
    if (cleanBase64.includes('base64,')) {
      cleanBase64 = cleanBase64.split('base64,')[1];
    }
    formData.append('image', cleanBase64);
  } else {
    throw new Error('অকার্যকর ইমেজ ফাইল');
  }

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    body: formData
  });

  const resText = await response.text();
  let jsonRes;
  try {
    jsonRes = JSON.parse(resText);
  } catch (e) {
    if (resText.includes('forbidden')) {
      throw new Error('ImgBB আপনার ব্রাউজার আইপি সাময়িক ব্লক করেছে। অনুগ্রহ করে মোবাইল নেটওয়ার্ক অথবা ভিপিএন পরিবর্তন করুন অথবা সরাসরি অনলাইন ছবির লিংক বসান।');
    }
    throw new Error(`ImgBB রেসপন্স পড়তে সমস্যা হয়েছে (${response.status})`);
  }

  if (!response.ok || !jsonRes.success) {
    throw new Error(jsonRes?.error?.message || 'ছবি আপলোড করতে ব্যর্থ হয়েছে।');
  }

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

  // Return the permanent image URL
  return directUrl;
}

/**
 * Deletes an image from ImgBB using its delete_url
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

    await fetch('/api/upload/delete', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ delete_url: deleteUrl })
    });
  } catch (e) {
    console.warn('Image deletion request error:', e);
  }
}
