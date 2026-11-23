// Cryptographic helpers using standard Web Crypto API (SHA-256 salted hashing)
// Passwords are never stored or logged in plaintext.

export function generateRandomSalt(length: number = 16): string {
  const arr = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}:cosmos-qatar-secure`);
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback if subtle crypto is somehow unavailable
  let hash = 0;
  const str = `${salt}:${password}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(32, '0');
}

export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
  const computed = await hashPasswordWithSalt(password, salt);
  return computed === hash;
}

export function generateResetToken(): string {
  const rand = generateRandomSalt(16);
  const time = Date.now().toString(36);
  return `rst-${time}-${rand.slice(0, 12)}`;
}
