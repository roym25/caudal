export const SESSION_COOKIE_NAME = 'caudal_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export function isPinProtectionEnabled() {
  const pin = process.env.CAUDAL_ACCESS_PIN;
  return Boolean(pin && String(pin).trim() !== '');
}

function getSecretKeyMaterial() {
  const pin = String(process.env.CAUDAL_ACCESS_PIN || '').trim();
  const secret = String(process.env.CAUDAL_AUTH_SECRET || 'caudal-v2-default-hmac-secret').trim();
  // Binding the secret to the current PIN ensures changing the PIN invalidates all active tokens
  return `${secret}::${pin}`;
}

async function signHmac(message) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(getSecretKeyMaterial());
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSessionToken() {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `v1.${expiresAt}`;
  const sig = await signHmac(payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token) {
  if (!isPinProtectionEnabled()) return true;
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [version, expiresAtStr, providedSig] = parts;
  if (version !== 'v1') return false;

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const payload = `${version}.${expiresAtStr}`;
  const expectedSig = await signHmac(payload);
  if (providedSig.length !== expectedSig.length) return false;

  let mismatch = 0;
  for (let i = 0; i < expectedSig.length; i++) {
    mismatch |= providedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return mismatch === 0;
}
