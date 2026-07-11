export interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: { client_id: string; callback: (resp: GoogleCredentialResponse) => void }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
  prompt: () => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

export function waitForGoogleIdentity(timeoutMs = 5000): Promise<GoogleAccountsId | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      if (window.google?.accounts?.id) return resolve(window.google.accounts.id);
      if (Date.now() - start > timeoutMs) return resolve(null);
      setTimeout(check, 100);
    };
    check();
  });
}
