'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockClosedIcon } from '@/components/icons';

const KEYPAD_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e) => {
    if (e) e.preventDefault();
    if (!pin || loading) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        setError('Incorrect PIN. Try again.');
        setPin('');
        setLoading(false);
        return;
      }

      router.replace('/');
      router.refresh();
    } catch {
      setError('Network error. Check your connection.');
      setLoading(false);
    }
  };

  const appendDigit = (digit) => {
    setError('');
    setPin((prev) => (prev.length < 12 ? prev + digit : prev));
  };

  const backspace = () => {
    setError('');
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xs bg-caudal-surface border border-caudal-border rounded-2xl p-6 shadow-2xl space-y-5">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-40 rounded-xl overflow-hidden border border-caudal-border bg-black/70 px-3 py-2 flex items-center justify-center mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/caudal-logo.png" alt="Caudal" className="h-10 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-1.5 text-caudal-text font-bold text-base">
            <LockClosedIcon className="w-4 h-4 text-caudal-green" />
            <span>Unlock Caudal</span>
          </div>
          <p className="text-xs text-caudal-text-muted mt-0.5">Enter your access PIN to continue</p>
        </div>

        {/* Form & Input */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setError('');
                setPin(e.target.value);
              }}
              className="w-full bg-caudal-surface-alt border border-caudal-border rounded-xl px-4 py-3 text-center text-xl tracking-[0.4em] font-mono text-caudal-text focus:outline-none focus:border-caudal-green transition-colors"
              aria-label="Access PIN"
            />
            {error && (
              <p className="text-xs text-caudal-error text-center font-medium mt-2">{error}</p>
            )}
          </div>

          {/* Touch numeric keypad for mobile convenience */}
          <div className="grid grid-cols-3 gap-2 select-none">
            {KEYPAD_DIGITS.map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => appendDigit(digit)}
                className="h-12 rounded-xl bg-caudal-surface-alt hover:bg-caudal-border/60 active:scale-95 border border-caudal-border/60 text-base font-bold text-caudal-text transition-all"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setError('');
                setPin('');
              }}
              className="h-12 rounded-xl bg-caudal-surface-alt hover:bg-caudal-border/60 active:scale-95 border border-caudal-border/60 text-xs font-semibold text-caudal-text-muted transition-all"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => appendDigit('0')}
              className="h-12 rounded-xl bg-caudal-surface-alt hover:bg-caudal-border/60 active:scale-95 border border-caudal-border/60 text-base font-bold text-caudal-text transition-all"
            >
              0
            </button>
            <button
              type="button"
              onClick={backspace}
              className="h-12 rounded-xl bg-caudal-surface-alt hover:bg-caudal-border/60 active:scale-95 border border-caudal-border/60 text-sm font-semibold text-caudal-text-muted transition-all"
              aria-label="Backspace"
            >
              ⌫
            </button>
          </div>

          <button
            type="submit"
            disabled={!pin || loading}
            className="w-full py-3 rounded-xl bg-caudal-green text-caudal-bg font-bold text-sm hover:bg-caudal-green-dim transition-colors disabled:opacity-50"
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
