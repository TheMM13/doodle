import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";

export function LoginScreen() {
  const { loginGuest } = useAuth();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitGuest = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await loginGuest(name.trim());
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen login-screen">
      <h1 className="logo">doodle.io</h1>
      <p className="subtitle">Draw. Guess. Win.</p>

      <form onSubmit={submitGuest} className="guest-form">
        <input
          className="text-input"
          placeholder="Enter a nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
        />
        <button className="primary-btn" disabled={busy || !name.trim()} type="submit">
          {busy ? "Signing in..." : "Play!"}
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
