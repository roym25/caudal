import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  createSessionToken,
  isPinProtectionEnabled,
} from '@/lib/auth';

export async function GET() {
  const expectedPin = String(process.env.CAUDAL_ACCESS_PIN || '').trim();
  return NextResponse.json({
    protectionEnabled: isPinProtectionEnabled(),
    pinLength: expectedPin.length > 0 ? expectedPin.length : 4,
  });
}

export async function POST(request) {
  try {
    if (!isPinProtectionEnabled()) {
      return NextResponse.json({ ok: true, protectionEnabled: false });
    }

    const body = await request.json();
    const enteredPin = String(body?.pin || '').trim();
    const expectedPin = String(process.env.CAUDAL_ACCESS_PIN || '').trim();

    if (!enteredPin || enteredPin !== expectedPin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    const token = await createSessionToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
  }
}
