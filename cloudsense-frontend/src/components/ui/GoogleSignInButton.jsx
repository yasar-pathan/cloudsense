'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * Google Sign-In button using Google Identity Services (GSI).
 * Loads the GSI script on mount and renders Google's branded button.
 *
 * @param {Object} props
 * @param {(credential: string) => Promise} props.onSuccess — called with the Google ID token
 * @param {(error: string) => void} [props.onError] — called on failure
 */
export default function GoogleSignInButton({ onSuccess, onError }) {
  const buttonRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  const isConfigured = Boolean(GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('your-google-client-id'));

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    // If GSI is already loaded
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setScriptLoaded(true));
      existingScript.addEventListener('error', () => setScriptError(true));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptError(true);
    document.head.appendChild(script);
  }, [isConfigured]);

  useEffect(() => {
    if (!isConfigured || !scriptLoaded || !buttonRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError?.('Google sign-in was cancelled');
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: buttonRef.current.offsetWidth || 384,
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      });
    } catch (err) {
      console.error('Failed to initialize Google Sign-In:', err);
      onError?.('Failed to initialize Google Sign-In');
    }
  }, [isConfigured, scriptLoaded, onSuccess, onError]);

  if (!isConfigured) {
    return (
      <div className="w-full">
        <button
          type="button"
          disabled
          title="To enable Google Sign-In, set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env file"
          className="w-full py-2.5 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 text-xs text-center flex items-center justify-center gap-2.5 shadow-sm transition-colors cursor-not-allowed group relative"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="font-medium text-slate-700">Continue with Google</span>
          <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-mono ml-auto">
            Setup Client ID
          </span>
        </button>
      </div>
    );
  }

  if (scriptError) {
    return (
      <button
        type="button"
        disabled
        className="w-full py-2.5 px-4 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-xs text-center cursor-not-allowed"
      >
        Google Sign-In unavailable
      </button>
    );
  }

  return (
    <div className="w-full">
      {!scriptLoaded && (
        <div className="w-full py-2.5 px-4 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading Google Sign-In...</span>
        </div>
      )}
      <div
        ref={buttonRef}
        className={`w-full flex justify-center ${scriptLoaded ? '' : 'h-0 overflow-hidden'}`}
        style={{ colorScheme: 'light' }}
      />
    </div>
  );
}
