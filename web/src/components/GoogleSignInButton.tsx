import { useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID } from "../api/config";
import { waitForGoogleIdentity } from "../auth/googleAuth";

interface Props {
  onToken: (idToken: string) => void;
}

export function GoogleSignInButton({ onToken }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    waitForGoogleIdentity().then((accountsId) => {
      if (cancelled || !accountsId || !containerRef.current) return;
      accountsId.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp) => onToken(resp.credential),
      });
      accountsId.renderButton(containerRef.current, { theme: "outline", size: "large", width: 280 });
      setAvailable(true);
    });
    return () => {
      cancelled = true;
    };
  }, [onToken]);

  if (!GOOGLE_CLIENT_ID) {
    return <p className="hint">Add a Google OAuth client ID to web/.env to enable this.</p>;
  }

  return (
    <div>
      <div ref={containerRef} />
      {!available && <p className="hint">Loading Google Sign-In...</p>}
    </div>
  );
}
