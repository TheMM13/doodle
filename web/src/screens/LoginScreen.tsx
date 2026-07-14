import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { AvatarPicker } from "../components/AvatarPicker";
import type { Avatar } from "../game/types";

const AVATAR_KEY = "doodle_last_avatar";

function loadSavedAvatar(): Avatar {
  try {
    const raw = localStorage.getItem(AVATAR_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore malformed storage
  }
  return { face: 0, color: "#5aa9e6", hat: 0 };
}

export function LoginScreen() {
  const { loginGuest } = useAuth();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<Avatar>(loadSavedAvatar);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitGuest = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      localStorage.setItem(AVATAR_KEY, JSON.stringify(avatar));
      await loginGuest(name.trim(), avatar);
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

      <AvatarPicker avatar={avatar} onChange={setAvatar} />

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
