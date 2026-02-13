/**
 * Generate a SHA-256 hash from a string
 * Used for creating user ID hashes to prevent duplicate voting
 */
export async function generateHash(input: string): Promise<string> {
  // For browser environment
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  // For Node.js environment (server-side)
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Generate a user ID hash from browser fingerprint
 * Combines multiple browser properties for a semi-unique identifier
 */
export async function generateUserIdHash(): Promise<string> {
  if (typeof window === 'undefined') {
    // Server-side: return a random hash
    return generateHash(Math.random().toString());
  }

  // Combine various browser properties to create a fingerprint
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
    screen.width + 'x' + screen.height,
    screen.colorDepth.toString(),
  ].join('|');

  return generateHash(fingerprint);
}

/**
 * Generate a simple user ID hash from IP or session
 * This is a placeholder - you should use a proper session/IP based solution
 */
export async function generateSimpleUserHash(sessionId?: string): Promise<string> {
  const id = sessionId || `${Date.now()}-${Math.random()}`;
  return generateHash(id);
}
