import { useRef, useState, useEffect, type FormEvent } from "react";
import type { ChatMessage } from "../game/types";

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  disabledPlaceholder?: string;
}

export function ChatGuessBox({ messages, onSend, disabledPlaceholder }: Props) {
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="chat-box">
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-line ${m.kind === "system" ? "chat-system" : ""}`}>
            {m.kind === "chat" ? <span className="chat-name">{m.name}: </span> : null}
            {m.text}
          </div>
        ))}
      </div>
      <form className="chat-input-row" onSubmit={send}>
        <input
          className="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabledPlaceholder ?? "Type your guess..."}
        />
        <button className="chat-send" type="submit">
          Send
        </button>
      </form>
    </div>
  );
}
