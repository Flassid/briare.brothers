import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 12;

// Simple token structure (JWT-like but simpler for MVP)
interface TokenPayload {
  userId: string;
  exp: number;
}

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a simple session token
 * For MVP, using a simple base64-encoded JSON with HMAC signature
 */
export function generateToken(userId: string): string {
  const payload: TokenPayload = {
    userId,
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
  };

  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('hex');

  return `${data}.${signature}`;
}

/**
 * Verify and decode a token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const [data, signature] = token.split('.');
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest('hex');

    if (signature !== expectedSignature) {
      return null;
    }

    // Decode payload
    const payload: TokenPayload = JSON.parse(Buffer.from(data, 'base64').toString());

    // Check expiration
    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Generate a random invite code
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar chars (0/O, 1/I/L)
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
