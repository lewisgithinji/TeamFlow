import crypto from 'crypto';

/**
 * Encryption utility for sensitive data (OAuth tokens, API keys, etc.)
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.warn('WARNING: ENCRYPTION_KEY not set in environment variables. Using default key for development.');
}

/**
 * Get or generate encryption key
 * In production, ENCRYPTION_KEY must be set in environment
 */
function getEncryptionKey(): Buffer {
  if (ENCRYPTION_KEY) {
    // Key should be 32 bytes (64 hex characters)
    return Buffer.from(ENCRYPTION_KEY, 'hex');
  }

  // Development fallback - generate deterministic key
  // WARNING: Not secure for production!
  const devKey = crypto.createHash('sha256').update('teamflow-dev-key').digest();
  return devKey;
}

/**
 * Encrypt text using AES-256-GCM
 * Returns format: iv:authTag:encryptedData (all hex-encoded)
 *
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format "iv:authTag:encrypted"
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted (all hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt text encrypted with AES-256-GCM
 * Expects format: iv:authTag:encryptedData (all hex-encoded)
 *
 * @param encrypted - Encrypted string in format "iv:authTag:encrypted"
 * @returns Decrypted plain text
 */
export function decrypt(encrypted: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encrypted.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encryptedData = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a random encryption key
 * Use this to generate ENCRYPTION_KEY for environment variables
 *
 * @returns 32-byte key as hex string (64 characters)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash sensitive data (one-way)
 * Use for data that needs verification but not decryption
 *
 * @param data - Data to hash
 * @returns SHA-256 hash as hex string
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}
