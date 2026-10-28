import { apiRequest } from './api.js';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (momentListener?: (moment: any) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: string | number;
              locale?: string;
            }
          ) => void;
          disableAutoSelect?: () => void;
        };
      };
    };
  }
}

let cachedClientId: string | null = null;

export async function getGoogleClientId(): Promise<string> {
  if (cachedClientId) return cachedClientId;

  // 1. Check Vite env variable if provided
  const viteClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  if (viteClientId) {
    cachedClientId = viteClientId;
    return viteClientId;
  }

  // 2. Query backend configuration endpoint
  try {
    const res = await apiRequest<{ clientId: string }>('/auth/google/config');
    if (res && res.clientId) {
      cachedClientId = res.clientId;
      return res.clientId;
    }
  } catch (err) {
    console.warn('[AgriTech] Failed to fetch Google Client ID from backend:', err);
  }

  return '';
}

/**
 * Ensures Google Identity Services SDK script is loaded in the DOM.
 */
export async function ensureGisScriptLoaded(): Promise<boolean> {
  if (window.google?.accounts?.id) {
    return true;
  }

  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(!!window.google?.accounts?.id);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    } else {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.id || attempts > 20) {
          clearInterval(interval);
          resolve(!!window.google?.accounts?.id);
        }
      }, 100);
    }
  });
}

let activeGisClientId: string | null = null;
const credentialCallbacks = new Set<(credential: string) => void>();

export function registerGisCredentialCallback(callback: (credential: string) => void): () => void {
  credentialCallbacks.add(callback);
  return () => {
    credentialCallbacks.delete(callback);
  };
}

/**
 * Initializes GIS exactly once per clientId to eliminate duplicate initialization warnings.
 */
export function initializeGis(clientId: string): boolean {
  if (!clientId || !window.google?.accounts?.id) return false;
  if ((window as any).__agritechGisInitialized === clientId) return true;

  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (res: { credential: string }) => {
        if (res.credential) {
          credentialCallbacks.forEach((cb) => cb(res.credential));
        }
      },
    });
    (window as any).__agritechGisInitialized = clientId;
    activeGisClientId = clientId;
    return true;
  } catch (err) {
    console.warn('[AgriTech] Google Identity Services initialize warning:', err);
    return false;
  }
}
