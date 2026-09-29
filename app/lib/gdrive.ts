import { DBManager } from '../../server/db';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '946784607418-chm082t91m0grdpi8s632tl10mcnj7la.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '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';
const FOLDER_NAME = 'ArotExpress Photos';

export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getRedirectUri(req?: Request): string {
  // If explicitly configured in env
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const clean = process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
    return `${clean}/api/gdrive/callback`;
  }

  // From incoming Request
  if (req) {
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (host) {
      return `${proto}://${host}/api/gdrive/callback`;
    }
  }

  return 'https://arotexpress.onrender.com/api/gdrive/callback';
}

export function getAuthUrl(redirectUri: string): string {
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ].join(' ');

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
    state: encodeURIComponent(redirectUri)
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'গুগল টোকেন এক্সচেঞ্জ ব্যর্থ হয়েছে');
  }

  return {
    access_token: data.access_token as string,
    refresh_token: (data.refresh_token as string) || '',
    expires_in: (data.expires_in as number) || 3600
  };
}

export async function refreshAccessToken(refreshToken: string) {
  if (!refreshToken) {
    throw new Error('কোনো রিফ্রেশ টোকেন পাওয়া যায়নি');
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'টোকেন রিফ্রেশ করতে ব্যর্থ হয়েছে');
  }

  return {
    access_token: data.access_token as string,
    expires_in: (data.expires_in as number) || 3600
  };
}

export async function fetchUserInfo(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    throw new Error('গুগল ইউজার প্রোফাইল লোড করতে ব্যর্থ হয়েছে');
  }
  return await res.json();
}

export async function ensureDriveFolder(accessToken: string, folderName = FOLDER_NAME): Promise<string> {
  // 1. Search for existing folder
  const query = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // 2. Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'গুগল ড্রাইভে ArotExpress ফোল্ডার তৈরি করতে ব্যর্থ হয়েছে');
  }

  const created = await createRes.json();
  return created.id;
}

export async function getValidDriveSession() {
  await DBManager.init();
  const config = await DBManager.getGDriveConfig();

  if (!config || !config.is_connected) {
    throw new Error('গুগল ড্রাইভ কানেক্ট করা নেই। দয়া করে অ্যাডমিন প্যানেল থেকে সাইন-ইন করুন।');
  }

  let currentAccessToken = config.access_token || '';
  const now = Date.now();
  const expiry = config.token_expiry || 0;

  // If token is missing or expiring within 5 minutes, refresh it
  if (!currentAccessToken || expiry <= now + 300000) {
    if (!config.refresh_token) {
      throw new Error('গুগল ড্রাইভ সেশন শেষ হয়ে গেছে। অনুগ্রহ করে অ্যাডমিন প্যানেল থেকে পুনরায় লগইন করুন।');
    }

    try {
      const refreshed = await refreshAccessToken(config.refresh_token);
      currentAccessToken = refreshed.access_token;
      const newExpiry = Date.now() + (refreshed.expires_in * 1000);

      await DBManager.saveGDriveConfig({
        access_token: currentAccessToken,
        token_expiry: newExpiry,
        is_connected: true
      });
    } catch (err: any) {
      console.error('Error auto-refreshing GDrive access token:', err);
      throw new Error('গুগল ড্রাইভ সেশন রিনিউ ব্যর্থ: ' + (err.message || 'আবার লগইন করুন'));
    }
  }

  // Ensure folder ID exists
  let folderId = config.folder_id;
  if (!folderId) {
    try {
      folderId = await ensureDriveFolder(currentAccessToken);
      await DBManager.saveGDriveConfig({ folder_id: folderId });
    } catch (e: any) {
      console.warn('Could not auto-create folder:', e.message);
    }
  }

  return {
    accessToken: currentAccessToken,
    folderId,
    config
  };
}

export async function uploadImageBufferToDrive(
  buffer: Buffer | Uint8Array,
  fileName: string,
  mimeType: string
) {
  const session = await getValidDriveSession();
  const { accessToken, folderId } = session;

  const boundary = '-------arotexpress' + Date.now().toString(16);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName || `arot_${Date.now()}.jpg`,
    mimeType: mimeType || 'image/jpeg',
    parents: folderId ? [folderId] : []
  };

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const mediaHeader = `${delimiter}Content-Type: ${mimeType || 'image/jpeg'}\r\nContent-Transfer-Encoding: binary\r\n\r\n`;

  const metadataBuffer = Buffer.from(metadataPart, 'utf-8');
  const mediaHeaderBuffer = Buffer.from(mediaHeader, 'utf-8');
  const closeDelimiterBuffer = Buffer.from(closeDelimiter, 'utf-8');

  const multipartBody = Buffer.concat([
    metadataBuffer,
    mediaHeaderBuffer,
    Buffer.from(buffer),
    closeDelimiterBuffer
  ]);

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webContentLink,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': multipartBody.length.toString()
    },
    body: multipartBody
  });

  const fileData = await uploadRes.json();
  if (!uploadRes.ok || !fileData.id) {
    throw new Error(fileData?.error?.message || 'গুগল ড্রাইভে ফাইল আপলোড করতে ব্যর্থ হয়েছে');
  }

  const fileId = fileData.id;

  // Make the file publicly viewable with link
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
  } catch (permErr) {
    console.warn('Warning setting file public permission:', permErr);
  }

  // Fast direct CDN preview link
  const directCdnUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

  return {
    file_id: fileId,
    url: directCdnUrl,
    display_url: directCdnUrl,
    delete_url: `gdrive:${fileId}`,
    name: fileData.name || fileName
  };
}

export function extractDriveFileId(fileIdOrUrl: string): string | null {
  if (!fileIdOrUrl || typeof fileIdOrUrl !== 'string') return null;
  const clean = fileIdOrUrl.trim();

  // Pattern: gdrive:FILE_ID
  if (clean.startsWith('gdrive:')) {
    return clean.replace('gdrive:', '').trim();
  }

  // Pattern: https://lh3.googleusercontent.com/d/FILE_ID
  const lh3Match = clean.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3Match && lh3Match[1]) {
    return lh3Match[1];
  }

  // Pattern: id=FILE_ID
  const idParamMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  // Pattern: /file/d/FILE_ID
  const fileDMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // If it's a plain alphanumeric ID (standard drive ID length is usually 25-45 characters)
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(clean)) {
    return clean;
  }

  return null;
}

export async function deleteDriveFile(fileIdOrUrl: string) {
  const fileId = extractDriveFileId(fileIdOrUrl);
  if (!fileId) {
    return false;
  }

  try {
    const session = await getValidDriveSession();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.accessToken}`
      }
    });

    return res.ok || res.status === 404;
  } catch (err: any) {
    console.warn('Failed to delete Google Drive file:', fileId, err.message);
    return false;
  }
}

export async function getDriveAccountStats() {
  await DBManager.init();
  const config = await DBManager.getGDriveConfig();

  if (!config || !config.is_connected) {
    return {
      is_connected: false,
      account_email: '',
      account_name: '',
      account_picture: '',
      storage_total_bytes: 0,
      storage_used_bytes: 0,
      storage_free_bytes: 0,
      storage_total_formatted: '0 GB',
      storage_used_formatted: '0 GB',
      storage_free_formatted: '0 GB',
      storage_percentage: 0,
      folder_image_count: 0,
      folder_name: FOLDER_NAME,
      folder_id: ''
    };
  }

  try {
    const session = await getValidDriveSession();
    const accessToken = session.accessToken;

    // 1. Fetch user info & storage quota
    const aboutRes = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota,user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    let storageTotal = 15 * 1024 * 1024 * 1024; // Default 15 GB
    let storageUsed = 0;
    let userEmail = config.account_email || '';
    let userName = config.account_name || '';
    let userPicture = config.account_picture || '';

    if (aboutRes.ok) {
      const aboutData = await aboutRes.json();
      if (aboutData.storageQuota) {
        storageTotal = Number(aboutData.storageQuota.limit) || storageTotal;
        storageUsed = Number(aboutData.storageQuota.usage) || 0;
      }
      if (aboutData.user) {
        userEmail = aboutData.user.emailAddress || userEmail;
        userName = aboutData.user.displayName || userName;
        userPicture = aboutData.user.photoLink || userPicture;
      }
    }

    const storageFree = Math.max(0, storageTotal - storageUsed);
    const percentage = storageTotal > 0 ? Math.min(100, (storageUsed / storageTotal) * 100) : 0;

    // 2. Count images in ArotExpress folder
    let folderImageCount = 0;
    if (session.folderId) {
      const q = encodeURIComponent(`'${session.folderId}' in parents and trashed = false`);
      const filesRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=1000&fields=files(id)`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (filesRes.ok) {
        const filesData = await filesRes.json();
        folderImageCount = filesData.files ? filesData.files.length : 0;
      }
    }

    return {
      is_connected: true,
      account_email: userEmail,
      account_name: userName,
      account_picture: userPicture,
      storage_total_bytes: storageTotal,
      storage_used_bytes: storageUsed,
      storage_free_bytes: storageFree,
      storage_total_formatted: formatBytes(storageTotal),
      storage_used_formatted: formatBytes(storageUsed),
      storage_free_formatted: formatBytes(storageFree),
      storage_percentage: parseFloat(percentage.toFixed(1)),
      folder_image_count: folderImageCount,
      folder_name: FOLDER_NAME,
      folder_id: session.folderId || ''
    };
  } catch (err: any) {
    console.error('Error fetching drive stats:', err);
    return {
      is_connected: Boolean(config.is_connected),
      account_email: config.account_email || '',
      account_name: config.account_name || '',
      account_picture: config.account_picture || '',
      storage_total_bytes: 0,
      storage_used_bytes: 0,
      storage_free_bytes: 0,
      storage_total_formatted: '15 GB',
      storage_used_formatted: '0 GB',
      storage_free_formatted: '15 GB',
      storage_percentage: 0,
      folder_image_count: 0,
      folder_name: FOLDER_NAME,
      folder_id: config.folder_id || '',
      error: err.message
    };
  }
}
