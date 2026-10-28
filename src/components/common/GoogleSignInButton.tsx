import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  getGoogleClientId,
  ensureGisScriptLoaded,
  initializeGis,
  registerGisCredentialCallback,
} from '../../lib/googleAuth.js';

interface GoogleSignInButtonProps {
  onClick?: () => void;
  onCredential?: (idToken: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onClick,
  onCredential,
  isLoading = false,
  disabled = false,
  className = '',
  label = 'Continue with Google',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gisRendered, setGisRendered] = useState(false);
  const onCredentialRef = useRef(onCredential);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let isMounted = true;

    async function initGisButton() {
      if (!containerRef.current) return;

      const clientId = await getGoogleClientId();
      if (!clientId || !isMounted) return;

      const loaded = await ensureGisScriptLoaded();
      if (!loaded || !isMounted || !window.google?.accounts?.id || !containerRef.current) return;

      initializeGis(clientId);

      // Render button once if container has no children
      if (containerRef.current.childElementCount === 0) {
        try {
          window.google.accounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 320,
          });

          if (isMounted) {
            setGisRendered(true);
          }
        } catch (err) {
          console.warn('[AgriTech] Google button render note:', err);
        }
      } else {
        if (isMounted) {
          setGisRendered(true);
        }
      }
    }

    initGisButton();

    const unsubscribe = registerGisCredentialCallback((credential) => {
      if (onCredentialRef.current) {
        onCredentialRef.current(credential);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <div className={`w-full relative min-h-[44px] flex items-center justify-center ${className}`}>
      {/* GIS rendered container (stable ref in DOM so GIS iframe persists) */}
      <div
        ref={containerRef}
        className={`w-full flex items-center justify-center overflow-hidden rounded-xl ${
          gisRendered && !isLoading && !disabled ? 'block' : 'hidden'
        }`}
      />

      {/* Fallback button when GIS is not rendered yet, or while loading/disabled */}
      {(!gisRendered || isLoading || disabled) && (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || isLoading}
          className="w-full relative flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-emerald-500/30 bg-[#071B13]/85 hover:bg-[#0D3022] active:bg-[#071B13] text-white font-semibold text-sm shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#00B879]/30 focus:border-[#00B879] disabled:opacity-60 disabled:cursor-not-allowed select-none cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          ) : (
            <svg
              className="w-5 h-5 shrink-0"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span>{isLoading ? 'Connecting to Google...' : label}</span>
        </button>
      )}
    </div>
  );
};
