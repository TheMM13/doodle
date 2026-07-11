import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "../api/config";
import { useAuth } from "../auth/AuthContext";
import type { Avatar, ChatMessage, RoomSettings, RoomState, Stroke } from "../game/types";

const LAST_ROOM_KEY = "doodle_last_room_code";

interface Ack {
  ok: boolean;
  error?: string;
  code?: string;
  roomId?: string;
  resumed?: boolean;
}

interface SocketContextValue {
  connected: boolean;
  room: RoomState | null;
  messages: ChatMessage[];
  privateNotice: { kind: "correct" | "close"; text: string } | null;
  createRoom: (avatar: Avatar, isPrivate: boolean, settings?: Partial<RoomSettings>) => Promise<Ack>;
  joinRoom: (code: string, avatar: Avatar) => Promise<Ack>;
  leaveRoom: () => void;
  startGame: () => Promise<Ack>;
  updateSettings: (settings: Partial<RoomSettings>) => Promise<Ack>;
  chooseWord: (word: string) => void;
  sendStroke: (stroke: Stroke) => void;
  sendGuess: (text: string) => void;
  kickVote: (targetUserId: string) => void;
  onCanvasStroke: (cb: (s: Stroke) => void) => () => void;
  onCanvasSync: (cb: (strokes: Stroke[]) => void) => () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [privateNotice, setPrivateNotice] = useState<{ kind: "correct" | "close"; text: string } | null>(null);
  const strokeListeners = useRef(new Set<(s: Stroke) => void>());
  const syncListeners = useRef(new Set<(s: Stroke[]) => void>());

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      setRoom(null);
      return;
    }

    // socket.io-client treats an empty string uri as a real (broken) host,
    // unlike undefined which correctly falls back to same-origin -- so only
    // pass a uri when API_URL is actually set (local dev against a
    // separately-running backend).
    const socket = API_URL
      ? io(API_URL, { auth: { token }, transports: ["websocket"] })
      : io({ auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      const lastCode = localStorage.getItem(LAST_ROOM_KEY);
      if (lastCode) {
        socket.emit("room:join", { code: lastCode, avatar: { face: 0, color: "#5aa9e6", hat: 0 } }, () => {});
      }
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("room:state", (state: RoomState) => setRoom(state));
    socket.on("chat:message", (msg: ChatMessage) => setMessages((prev) => [...prev.slice(-199), msg]));
    socket.on("chat:private", (msg: { kind: "correct" | "close"; text: string }) => {
      setPrivateNotice(msg);
      setTimeout(() => setPrivateNotice((cur) => (cur === msg ? null : cur)), 3000);
    });
    socket.on("canvas:stroke", (stroke: Stroke) => strokeListeners.current.forEach((cb) => cb(stroke)));
    socket.on("canvas:sync", (strokes: Stroke[]) => syncListeners.current.forEach((cb) => cb(strokes)));

    return () => {
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect();
      }
    };
    const onOnline = () => {
      if (socketRef.current && !socketRef.current.connected) socketRef.current.connect();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  const createRoom = useCallback(
    (avatar: Avatar, isPrivate: boolean, settings?: Partial<RoomSettings>) =>
      new Promise<Ack>((resolve) => {
        socketRef.current?.emit("room:create", { avatar, isPrivate, settings }, (ack: Ack) => {
          if (ack.ok && ack.code) localStorage.setItem(LAST_ROOM_KEY, ack.code);
          resolve(ack);
        });
      }),
    []
  );

  const joinRoom = useCallback(
    (code: string, avatar: Avatar) =>
      new Promise<Ack>((resolve) => {
        setMessages([]);
        socketRef.current?.emit("room:join", { code, avatar }, (ack: Ack) => {
          if (ack.ok && ack.code) localStorage.setItem(LAST_ROOM_KEY, ack.code);
          resolve(ack);
        });
      }),
    []
  );

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit("room:leave");
    localStorage.removeItem(LAST_ROOM_KEY);
    setRoom(null);
    setMessages([]);
  }, []);

  const startGame = useCallback(
    () =>
      new Promise<Ack>((resolve) => {
        socketRef.current?.emit("game:start", {}, (ack: Ack) => resolve(ack));
      }),
    []
  );

  const updateSettings = useCallback(
    (settings: Partial<RoomSettings>) =>
      new Promise<Ack>((resolve) => {
        socketRef.current?.emit("room:updateSettings", settings, (ack: Ack) => resolve(ack));
      }),
    []
  );

  const chooseWord = useCallback((word: string) => socketRef.current?.emit("game:chooseWord", { word }), []);
  const sendStroke = useCallback((stroke: Stroke) => socketRef.current?.emit("game:stroke", stroke), []);
  const sendGuess = useCallback((text: string) => socketRef.current?.emit("game:guess", { text }), []);
  const kickVote = useCallback((targetUserId: string) => socketRef.current?.emit("game:kickVote", { targetUserId }), []);

  const onCanvasStroke = useCallback((cb: (s: Stroke) => void) => {
    strokeListeners.current.add(cb);
    return () => strokeListeners.current.delete(cb);
  }, []);
  const onCanvasSync = useCallback((cb: (s: Stroke[]) => void) => {
    syncListeners.current.add(cb);
    return () => syncListeners.current.delete(cb);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        connected,
        room,
        messages,
        privateNotice,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        updateSettings,
        chooseWord,
        sendStroke,
        sendGuess,
        kickVote,
        onCanvasStroke,
        onCanvasSync,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
