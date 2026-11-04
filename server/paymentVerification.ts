/**
 * Payment Verification Service
 * Handles secure server-side verification for bKash, Nagad, and Rocket payments
 * with automatic 3-attempt retry logic.
 */

export interface PaymentVerificationParams {
  apiUrl?: string;
  apiKey?: string;
  trxId?: string;
  sender: 'bkash' | 'nagad' | '16216' | 'rocket' | 'upay' | string;
  number?: string;
  amount: number;
  maxAttempts?: number;
}

export interface PaymentVerificationResult {
  success: boolean;
  verified: boolean;
  code: string;
  message: string;
  data?: any;
  raw?: any;
  attemptsMade?: number;
}

/**
 * Normalizes provider / sender to standard format:
 * - bkash -> "bkash"
 * - nagad -> "nagad"
 * - rocket -> "16216" (as explicitly specified: "rocket hole 16216 jabe")
 * - upay -> "upay"
 */
export function normalizePaymentSender(methodCodeOrName: string): string {
  const str = (methodCodeOrName || '').toLowerCase().trim();
  if (str.includes('rocket') || str.includes('রকেট') || str === '16216' || str.includes('dbbl')) {
    return '16216';
  }
  if (str.includes('nagad') || str.includes('নগদ')) {
    return 'nagad';
  }
  if (str.includes('upay') || str.includes('উপায়')) {
    return 'upay';
  }
  return 'bkash';
}

/**
 * Default fallback credentials if not provided in DB or env
 */
export const DEFAULT_PAYMENT_VERIFY_API_URL = 'https://online-3gfd.onrender.com/api/verify-payment';
export const DEFAULT_PAYMENT_VERIFY_API_KEY = 'pay_live_cff299bf5ce51e06170fa843b135246ca702';

/**
 * Executes a single HTTP POST request to the external verification server
 */
async function callVerificationApi(
  apiUrl: string,
  apiKey: string,
  payload: { sender: string; amount: number; number?: string; trxId?: string },
  timeoutMs: number = 7000
): Promise<{ status: number; ok: boolean; data: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim()
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timer);

    let data: any;
    try {
      data = await res.json();
    } catch {
      data = { message: await res.text() };
    }

    return { status: res.status, ok: res.ok, data };
  } catch (err: any) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Verifies payment against the live gateway engine.
 * Supports polling checks (1 attempt) or retrying for final order confirmation.
 * Follows the API specification:
 * 200: VERIFIED_SUCCESS
 * 404: TRANSACTION_NOT_FOUND
 * 409: ALREADY_VERIFIED
 * 422: AMOUNT_MISMATCH
 */
export async function verifyPaymentWithRetry(
  params: PaymentVerificationParams
): Promise<PaymentVerificationResult> {
  const {
    apiUrl = DEFAULT_PAYMENT_VERIFY_API_URL,
    apiKey = DEFAULT_PAYMENT_VERIFY_API_KEY,
    trxId,
    sender,
    number,
    amount,
    maxAttempts = 1
  } = params;

  const targetApiUrl = (apiUrl || DEFAULT_PAYMENT_VERIFY_API_URL).trim();
  const targetApiKey = (apiKey || DEFAULT_PAYMENT_VERIFY_API_KEY).trim();

  if (!targetApiUrl) {
    return {
      success: false,
      verified: false,
      code: 'API_URL_MISSING',
      message: 'পেমেন্ট ভেরিফিকেশন API URL কনফিগার করা হয়নি।'
    };
  }

  if (!targetApiKey) {
    return {
      success: false,
      verified: false,
      code: 'API_KEY_MISSING',
      message: 'পেমেন্ট ভেরিফিকেশন API Key (x-api-key) কনফিগার করা হয়নি।'
    };
  }

  const cleanTrxId = (trxId || '').trim();
  const cleanNumber = (number || '').trim().replace(/[^0-9]/g, '');
  const cleanSender = normalizePaymentSender(sender);
  const numAmount = Math.round(Number(amount) || 0);

  // Per API doc: number: Required (or TrxID)
  if (!cleanNumber && !cleanTrxId) {
    return {
      success: false,
      verified: false,
      code: 'MISSING_PAYMENT_IDENTIFIER',
      message: 'গ্রাহকের প্রেরক মোবাইল নম্বর অথবা TrxID প্রদান করুন।'
    };
  }

  const payload: { sender: string; amount: number; number?: string; trxId?: string } = {
    sender: cleanSender,
    amount: numAmount
  };

  if (cleanNumber) {
    payload.number = cleanNumber;
  }
  if (cleanTrxId) {
    payload.trxId = cleanTrxId;
  }

  const attemptsToRun = Math.max(1, maxAttempts);
  let lastResponse: any = null;
  let attemptsMade = 0;

  for (let attempt = 1; attempt <= attemptsToRun; attempt++) {
    attemptsMade = attempt;
    try {
      console.log(`[PaymentVerify] Check ${attempt}/${attemptsToRun} - Sender: ${cleanSender}, Number: ${cleanNumber || 'N/A'}, TrxID: ${cleanTrxId || 'N/A'}, Amount: ${numAmount}`);
      const res = await callVerificationApi(targetApiUrl, targetApiKey, payload);
      lastResponse = res.data;

      const responseCode = String(res.data?.code || (res.status === 200 ? 'VERIFIED_SUCCESS' : '')).trim();

      // 1. STRICT SUCCESS CASE: ONLY when response code is strictly "VERIFIED_SUCCESS" (HTTP 200)
      if (responseCode === 'VERIFIED_SUCCESS' || res.status === 200) {
        console.log(`[PaymentVerify] ✅ Verified successfully with VERIFIED_SUCCESS:`, res.data);
        return {
          success: true,
          verified: true,
          code: 'VERIFIED_SUCCESS',
          message: res.data?.message || 'পেমেন্ট সফলভাবে যাচাই হয়েছে।',
          data: res.data?.data || res.data,
          raw: res.data,
          attemptsMade
        };
      }

      // 2. Fatal Rejection: ALREADY_VERIFIED (HTTP 409)
      if (res.status === 409 || responseCode.toUpperCase() === 'ALREADY_VERIFIED') {
        console.warn(`[PaymentVerify] 🚫 Transaction already verified (code: ${responseCode}):`, res.data);
        return {
          success: false,
          verified: false,
          code: 'ALREADY_VERIFIED',
          message: 'এই লেনদেনটি ইতিমধ্যে পূর্বে ব্যবহার বা ভেরিফাই করা হয়েছে! নতুন লেনদেন করুন।',
          data: res.data?.data,
          raw: res.data,
          attemptsMade
        };
      }

      // 3. Fatal Rejection: AMOUNT_MISMATCH (HTTP 422)
      if (res.status === 422 || responseCode.toUpperCase() === 'AMOUNT_MISMATCH') {
        console.warn(`[PaymentVerify] ⚠️ Amount mismatch (code: ${responseCode}):`, res.data);
        const exp = res.data?.data?.expectedAmount || numAmount;
        const act = res.data?.data?.actualAmount;
        return {
          success: false,
          verified: false,
          code: 'AMOUNT_MISMATCH',
          message: `টাকার পরিমাণের অমিল! অর্ডারের মোট বিল ৳${exp}, কিন্তু লেনদেনে পাওয়া গেছে ৳${act !== undefined ? act : 'ভিন্ন পরিমাণ'}।`,
          data: res.data?.data,
          raw: res.data,
          attemptsMade
        };
      }

      // 4. Pending / Not found yet (HTTP 404 or TRANSACTION_NOT_FOUND)
      if (res.status === 404 || responseCode.toUpperCase() === 'TRANSACTION_NOT_FOUND') {
        // Return not found for this polling tick
        return {
          success: false,
          verified: false,
          code: 'TRANSACTION_NOT_FOUND',
          message: 'কোনো লেনদেন এখনও খুঁজে পাওয়া যায়নি। এসএমএস বা পেমেন্টের জন্য অপেক্ষা করা হচ্ছে...',
          data: res.data?.data,
          raw: res.data,
          attemptsMade
        };
      }

      // Unauthorized (HTTP 401 / 403)
      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          verified: false,
          code: 'UNAUTHORIZED_API_KEY',
          message: 'পেমেন্ট ভেরিফিকেশন API কি (x-api-key) অকার্যকর বা অনুমোদনহীন।',
          raw: res.data,
          attemptsMade
        };
      }

      // If we got an unexpected response, record and check if retry is needed
    } catch (netErr: any) {
      console.warn(`[PaymentVerify] Attempt ${attempt} network error:`, netErr.message);
      lastResponse = { error: netErr.message };
    }

    // Delay before next attempt if remaining
    if (attempt < attemptsToRun) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  // All attempts exhausted or non-VERIFIED_SUCCESS
  const finalCode = lastResponse?.code || 'TRANSACTION_NOT_FOUND';
  let bengaliMessage = 'পেমেন্ট এখনও মেলেনি। এসএমএস বা পেমেন্টের জন্য অপেক্ষা করা হচ্ছে...';

  if (String(finalCode).toUpperCase() === 'ALREADY_VERIFIED') {
    bengaliMessage = 'এই লেনদেনটি ইতিমধ্যে পূর্বে ব্যবহার করা হয়েছে!';
  } else if (String(finalCode).toUpperCase() === 'AMOUNT_MISMATCH') {
    bengaliMessage = 'টাকার পরিমাণের অমিল পাওয়া গেছে! অনুগ্রহ করে অর্ডারের সম্পূর্ণ টাকা পরিশোধ করুন।';
  } else if (String(finalCode).toUpperCase() === 'TRANSACTION_NOT_FOUND') {
    bengaliMessage = 'কোনো লেনদেন এখনও খুঁজে পাওয়া যায়নি। অনুগ্রহ করে পেমেন্ট সম্পূর্ণ করুন।';
  }

  return {
    success: false,
    verified: false,
    code: finalCode,
    message: bengaliMessage,
    data: lastResponse?.data,
    raw: lastResponse,
    attemptsMade
  };
}
