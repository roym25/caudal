'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LockClosedIcon } from '@/components/icons';

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [pinLength, setPinLength] = useState(4);
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const verifyingRef = useRef(false);

  // Prefetch dashboard immediately and get expected PIN length for instant auto-submit
  useEffect(() => {
    router.prefetch('/');
    fetch('/api/auth/login')
      .then((r) => r.json())
      .then((data) => {
        if (data?.pinLength && data.pinLength > 0) {
          setPinLength(data.pinLength);
        }
      })
      .catch(() => {});
  }, [router]);

  const verifyPin = useCallback(
    async (candidatePin) => {
      if (verifyingRef.current) return;
      verifyingRef.current = true;
      setVerifying(true);
      setError(false);

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: candidatePin }),
        });

        if (!res.ok) {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([40, 40, 40]);
          }
          setError(true);
          setVerifying(false);
          verifyingRef.current = false;
          setTimeout(() => {
            setPin('');
          }, 260);
          return;
        }

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(15);
        }
        setUnlocked(true);
        router.replace('/');
      } catch {
        setError(true);
        setVerifying(false);
        verifyingRef.current = false;
        setPin('');
      }
    },
    [router]
  );

  const handleDigit = useCallback(
    (digit) => {
      if (verifyingRef.current || unlocked) return;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(8);
      }
      setError(false);
      setPin((prev) => {
        if (prev.length >= pinLength) return prev;
        const next = prev + digit;
        if (next.length === pinLength) {
          // Trigger verification immediately on final digit
          setTimeout(() => verifyPin(next), 40);
        }
        return next;
      });
    },
    [pinLength, unlocked, verifyPin]
  );

  const handleBackspace = useCallback(() => {
    if (verifyingRef.current || unlocked) return;
    setError(false);
    setPin((prev) => prev.slice(0, -1));
  }, [unlocked]);

  const handleClear = useCallback(() => {
    if (verifyingRef.current || unlocked) return;
    setError(false);
    setPin('');
  }, [unlocked]);

  // Support physical keyboard on desktop without rendering a text input
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter' && pin.length > 0) {
        e.preventDefault();
        verifyPin(pin);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDigit, handleBackspace, handleClear, pin, verifyPin]);

  const dots = Array.from({ length: pinLength });

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-between sm:justify-center px-6 py-10 select-none overflow-hidden">
      {/* Top spacer for mobile balance */}
      <div className=" sm:hidden" />

      <div className="w-full max-w-xs flex flex-col items-center">
        {/* Glowing Wave Emblem */}
        <div className="relative mb-5">
          <div className="absolute -inset-3 rounded-full bg-caudal-green/15 blur-xl pointer-events-none" />
          <div className="relative w-18 h-18 rounded-2xl bg-caudal-surface border border-caudal-border/90 shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon-192.png"
              alt="Caudal"
              className="w-14 h-14 object-contain"
            />
          </div>
        </div>

        {/* Title & Status */}
        <div className="flex items-center gap-1.5 text-caudal-text font-bold text-lg tracking-tight">
          <LockClosedIcon className="w-4 h-4 text-caudal-green" />
          <span>Caudal</span>
        </div>
        <p
          className={`text-xs mt-1 font-medium transition-colors duration-150 ${
            error
              ? 'text-caudal-error'
              : unlocked
              ? 'text-caudal-green'
              : 'text-caudal-text-muted'
          }`}
        >
          {error
            ? 'Incorrect PIN — try again'
            : unlocked
            ? 'Unlocked'
            : verifying
            ? 'Verifying...'
            : 'Enter your PIN'}
        </p>

        {/* Animated PIN Dots */}
        <div
          className={`flex items-center justify-center gap-4 my-8 ${
            error ? 'animate-shake' : ''
          }`}
        >
          {dots.map((_, idx) => {
            const isFilled = idx < pin.length;
            return (
              <span
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  error
                    ? 'bg-caudal-error border-2 border-caudal-error shadow-[0_0_12px_rgba(239,68,68,0.7)]'
                    : isFilled
                    ? 'bg-caudal-green border-2 border-caudal-green scale-115 shadow-[0_0_12px_rgba(0,200,83,0.75)]'
                    : 'bg-transparent border-2 border-caudal-border'
                } ${verifying ? 'animate-pulse' : ''}`}
              />
            );
          })}
        </div>

        {/* Circular Fintech Touch Keypad */}
        <div className="w-full max-w-[268px] space-y-3.5">
          {KEYPAD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-3 gap-4 justify-items-center">
              {row.map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  className="w-18 h-18 sm:w-16 sm:h-16 rounded-full bg-caudal-surface/85 backdrop-blur-md border border-caudal-border/80 text-2xl sm:text-xl font-semibold text-caudal-text flex items-center justify-center touch-manipulation transition-all duration-100 active:scale-90 active:bg-caudal-green/20 active:border-caudal-green/60 active:text-caudal-green hover:border-caudal-text-dim/60 shadow-md"
                >
                  {digit}
                </button>
              ))}
            </div>
          ))}

          {/* Bottom Row: Clear, 0, Backspace */}
          <div className="grid grid-cols-3 gap-4 justify-items-center items-center">
            <button
              type="button"
              onClick={handleClear}
              disabled={pin.length === 0}
              className="w-18 h-18 sm:w-16 sm:h-16 rounded-full text-xs font-semibold text-caudal-text-muted hover:text-caudal-text active:scale-90 transition-all flex items-center justify-center touch-manipulation disabled:opacity-0"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="w-18 h-18 sm:w-16 sm:h-16 rounded-full bg-caudal-surface/85 backdrop-blur-md border border-caudal-border/80 text-2xl sm:text-xl font-semibold text-caudal-text flex items-center justify-center touch-manipulation transition-all duration-100 active:scale-90 active:bg-caudal-green/20 active:border-caudal-green/60 active:text-caudal-green hover:border-caudal-text-dim/60 shadow-md"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              disabled={pin.length === 0}
              aria-label="Delete digit"
              className="w-18 h-18 sm:w-16 sm:h-16 rounded-full text-lg font-semibold text-caudal-text-muted hover:text-caudal-text active:scale-90 transition-all flex items-center justify-center touch-manipulation disabled:opacity-0"
            >
              ⌫
            </button>
          </div>
        </div>
      </div>

      {/* Bottom subtle branding */}
      <p className="text-[11px] text-caudal-text-dim tracking-wider uppercase sm:mt-8">
        Caudal Finance
      </p>
    </div>
  );
}
