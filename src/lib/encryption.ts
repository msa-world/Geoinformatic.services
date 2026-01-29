import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// In production, this should be a strong random string in process.env.ENCRYPTION_KEY
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-change-me-12345';
const IV_LENGTH = 16;

export function encrypt(text: string): string {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        // Derive a 32-byte key from the secret
        const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

export function decrypt(text: string): string {
    if (!text) return text;
    try {
        const textParts = text.split(':');
        const ivHex = textParts.shift();
        if (!ivHex) throw new Error('Invalid encrypted format');

        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}
