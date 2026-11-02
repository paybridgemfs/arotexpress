import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export const JWT_SECRET = process.env.JWT_SECRET || 'arot_express_secure_jwt_secret_key_8f93e1b72a0c';

export async function authenticateToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return { error: 'লগইন করুন', status: 401 };
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    return { user, token };
  } catch (err) {
    return { error: 'মেয়াদোত্তীর্ণ বা অবৈধ টোকেন', status: 403 };
  }
}
