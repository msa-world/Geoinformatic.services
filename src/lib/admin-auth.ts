import crypto from "crypto"

// Simple password hashing (for demo purposes - use bcrypt in production)
export function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + "salt")
    .digest("hex")
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// Admin credentials stored in environment or database
export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "Geo@1122",
}

export function validateAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password
}
