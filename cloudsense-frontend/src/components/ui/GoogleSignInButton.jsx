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

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setScriptError(true);
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
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !buttonRef.current || !GOOGLE_CLIENT_ID) return;

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
        width: buttonRef.current.offsetWidth,
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      });
    } catch (err) {
      console.error('Failed to initialize Google Sign-In:', err);
      onError?.('Failed to initialize Google Sign-In');
    }
  }, [scriptLoaded, onSuccess, onError]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
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
