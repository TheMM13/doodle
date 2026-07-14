import { useRef, useState, useEffect, type FormEvent } from "react";
import type { ChatMessage } from "../game/types";

const MAX_LEN = 100;

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  disabledPlaceholder?: string;
}

export function ChatGuessBox({ messages, onSend, disabledPlaceholder }: Props) {
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    if (atBottom) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, atBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 24);
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="chat-box">
      <div className="chat-messages" ref={scrollRef} onScroll={handleScroll}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-line chat-kind-${m.kind}`}>
            {m.kind === "chat" ? <span className="chat-name">{m.name}: </span> : null}
            {m.text}
          </div>
        ))}
      </div>
      <form className="chat-input-row" onSubmit={send}>
        <input
          className="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
          placeholder={disabledPlaceholder ?? "Type your guess..."}
          maxLength={MAX_LEN}
        />
        {text.length > 0 && (
          <span className={`chat-char-count ${text.length >= MAX_LEN ? "chat-char-count-max" : ""}`}>
            {text.length}/{MAX_LEN}
          </span>
        )}
        <button className="chat-send" type="submit">
          Send
        </button>
      </form>
    </div>
  );
}
