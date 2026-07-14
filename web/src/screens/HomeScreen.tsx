import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { useSocket } from "../socket/SocketContext";
import { AVATAR_FACES, AVATAR_HATS, FACE_COUNT, HAT_COUNT } from "../game/types";

export function HomeScreen() {
  const { user, logout } = useAuth();
  const { connected, createRoom, joinRoom } = useSocket();
  const avatar = user?.avatar ?? { face: 0, color: "#5aa9e6", hat: 0 };
  const [code, setCode] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    const ack = await createRoom(avatar, isPrivate);
    setBusy(false);
    if (!ack.ok) setError(ack.error ?? "Could not create room");
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    const ack = await joinRoom(code.trim().toUpperCase(), avatar);
    setBusy(false);
    if (!ack.ok) setError(ack.error ?? "Could not join room");
  };

  return (
    <div className="screen home-screen">
      <div className="home-header">
        <span className="home-avatar" style={{ backgroundColor: avatar.color }}>
          <span className="home-avatar-face">{AVATAR_FACES[avatar.face % FACE_COUNT]}</span>
          {avatar.hat > 0 && <span className="home-avatar-hat">{AVATAR_HATS[avatar.hat % HAT_COUNT]}</span>}
        </span>
        <div>
          <h1 className="title">Hi, {user?.name}</h1>
          <p className="status-line">{connected ? "🟢 connected" : "🔴 connecting..."}</p>
        </div>
      </div>

      <label className="toggle-row">
        <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
        Private room (invite by code only)
      </label>

      <button className="primary-btn" disabled={busy} onClick={handleCreate}>
        Create Room
      </button>

      <div className="divider" />

      <form onSubmit={handleJoin} className="join-form">
        <input
          className="text-input code-input"
          placeholder="Enter room code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
        />
        <button className="secondary-btn-green" disabled={busy} type="submit">
          Join Room
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      <button className="link-btn" onClick={logout}>
        Log out
      </button>
    </div>
  );
}
