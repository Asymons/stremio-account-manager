import CryptoJS from 'crypto-js'

const SALT_KEY = 'stremio-manager:salt'
const KEY_DERIVATION_ITERATIONS = 1000

function getEncryptionKey(): string {
  let salt = localStorage.getItem(SALT_KEY)
  if (!salt) {
    salt = CryptoJS.lib.WordArray.random(16).toString()
    localStorage.setItem(SALT_KEY, salt)
  }

  return CryptoJS.PBKDF2('stremio-manager-v1', salt, {
    keySize: 256 / 32,
    iterations: KEY_DERIVATION_ITERATIONS,
  }).toString()
}

export function encrypt(data: string): string {
  const key = getEncryptionKey()
  return CryptoJS.AES.encrypt(data, key).toString()
}

export function decrypt(encrypted: string): string {
  const key = getEncryptionKey()
  const bytes = CryptoJS.AES.decrypt(encrypted, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export function isEncrypted(value: string): boolean {
  // Very basic check - AES encrypted strings are base64 and contain "="
  // This is not foolproof but good enough for our use case
  try {
    return value.includes('U2FsdGVkX1') || (value.length > 20 && /^[A-Za-z0-9+/]+=*$/.test(value))
  } catch {
    return false
  }
}
