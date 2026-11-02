/**
 * Payment Verification Service
 * Handles secure server-side verification for bKash, Nagad, and Rocket payments
 * with automatic 3-attempt retry logic.
 */

export interface PaymentVerificationParams {
  apiUrl: string;
  apiKey: string;
  trxId: string;
  sender: 'bkash' | 'nagad' | '16216' | string;
  number: string;
  amount: number;
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
 */
export function normalizePaymentSender(methodCodeOrName: string): string {
  const str = (methodCodeOrName || '').toLowerCase().trim();
  if (str.includes('rocket') || str.includes('রকেট') || str === '16216' || str.includes('dbbl')) {
    return '16216';
  }
  if (str.includes('nagad') || str.includes('নগদ')) {
    return 'nagad';
  }
  return 'bkash';
}

/**
 * Executes a single HTTP POST request to the external verification server
 */
async function callVerificationApi(
  apiUrl: string,
  apiKey: string,
  payload: { trxId: string; sender: string; number: string; amount: number },
  timeoutMs: number = 8000
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
 * Verifies payment with up to 3 retries for pending/not-found states.
 * Fails fast on definitive errors like ALREADY_VERIFIED or AMOUNT_MISMATCH.
 */
export async function verifyPaymentWithRetry(
  params: PaymentVerificationParams
): Promise<PaymentVerificationResult> {
  const { apiUrl, apiKey, trxId, sender, number, amount } = params;

  if (!apiUrl || !apiUrl.trim()) {
    return {
      success: false,
      verified: false,
      code: 'API_URL_MISSING',
      message: 'পেমেন্ট ভেরিফিকেশন API URL কনফিগার করা হয়নি।'
    };
  }

  if (!apiKey || !apiKey.trim()) {
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

  if (!cleanTrxId) {
    return {
      success: false,
      verified: false,
      code: 'INVALID_TRX_ID',
      message: 'ট্রানজেকশন আইডি (TrxID) প্রদান করুন।'
    };
  }

  const payload = {
    trxId: cleanTrxId,
    sender: cleanSender,
    number: cleanNumber,
    amount: numAmount
  };

  const MAX_ATTEMPTS = 3;
  let lastResponse: any = null;
  let attemptsMade = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    attemptsMade = attempt;
    try {
      console.log(`[PaymentVerify] Attempt ${attempt}/${MAX_ATTEMPTS} for TrxID: ${cleanTrxId}, Sender: ${cleanSender}, Amount: ${numAmount}`);
      const res = await callVerificationApi(apiUrl.trim(), apiKey.trim(), payload);
      lastResponse = res.data;

      const responseCode = String(res.data?.code || '').trim();

      // 1. STRICT SUCCESS CASE: ONLY when response code is strictly "VERIFIED_SUCCESS"
      if (responseCode === 'VERIFIED_SUCCESS') {
        console.log(`[PaymentVerify] ✅ Verified successfully with VERIFIED_SUCCESS on attempt ${attempt}:`, res.data);
        return {
          success: true,
          verified: true,
          code: 'VERIFIED_SUCCESS',
          message: res.data.message || 'পেমেন্ট সফলভাবে যাচাই হয়েছে।',
          data: res.data.data,
          raw: res.data,
          attemptsMade
        };
      }

      // 2. Fatal Rejection: ALREADY_VERIFIED (under NO circumstances can this place an order)
      if (responseCode.toUpperCase() === 'ALREADY_VERIFIED') {
        console.warn(`[PaymentVerify] 🚫 Transaction already verified (code: ${responseCode}):`, res.data);
        return {
          success: false,
          verified: false,
          code: 'ALREADY_VERIFIED',
          message: 'এই TrxID টি ইতিমধ্যে পূর্বে ব্যবহার বা ভেরিফাই করা হয়েছে! এই TrxID দিয়ে কোনোভাবেই অর্ডার সম্পন্ন হবে না। অনুগ্রহ করে নতুন লেনদেনের TrxID দিন।',
          data: res.data?.data,
          raw: res.data,
          attemptsMade
        };
      }

      // 3. Fatal Rejection: AMOUNT_MISMATCH
      if (responseCode.toUpperCase() === 'AMOUNT_MISMATCH') {
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

      // If Unauthorized or Forbidden
      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          verified: false,
          code: 'UNAUTHORIZED_API_KEY',
          message: 'পেমেন্ট ভেরিফিকেশন API কি (x-api-key) অকার্যকর বা অনুমোদনহীন। অ্যাডমিন সেটিংস চেক করুন।',
          raw: res.data,
          attemptsMade
        };
      }

      // 3. Retryable condition: TRANSACTION_NOT_FOUND or temporary issue
      console.warn(`[PaymentVerify] Attempt ${attempt} result: ${responseCode || res.status}. Retrying if attempts remain...`);

    } catch (netErr: any) {
      console.warn(`[PaymentVerify] Attempt ${attempt} network error:`, netErr.message);
      lastResponse = { error: netErr.message };
    }

    // Delay before next attempt if remaining
    if (attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  // All 3 attempts exhausted or non-VERIFIED_SUCCESS
  const finalCode = lastResponse?.code || 'TRANSACTION_NOT_FOUND';
  let bengaliMessage = 'পেমেন্ট যাচাইকরণ ব্যর্থ হয়েছে। শুধুমাত্র সফল ভেরিফিকেশন (VERIFIED_SUCCESS) পেলেই অর্ডার সম্পন্ন হবে।';

  if (String(finalCode).toUpperCase() === 'ALREADY_VERIFIED') {
    bengaliMessage = 'এই TrxID টি ইতিমধ্যে পূর্বে ব্যবহার করা হয়েছে! এই TrxID দিয়ে কোনোভাবেই অর্ডার সম্পন্ন হবে না।';
  } else if (String(finalCode).toUpperCase() === 'AMOUNT_MISMATCH') {
    bengaliMessage = 'টাকার পরিমাণের অমিল পাওয়া গেছে! অনুগ্রহ করে অর্ডারের সম্পূর্ণ টাকা পরিশোধ করে সঠিক TrxID দিন।';
  } else if (String(finalCode).toUpperCase() === 'TRANSACTION_NOT_FOUND') {
    bengaliMessage = `TrxID "${cleanTrxId}" এর কোনো লেনদেন খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আপনার TrxID এবং প্রেরক নম্বর সঠিকভাবে চেক করুন। (৩ বার অনুসন্ধান করা হয়েছে)`;
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
