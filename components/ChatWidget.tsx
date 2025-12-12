import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import { useAuthStore } from "../store/authStore";
import { useChatStore, ChatMessage } from "../store/chatStore";

const audio: any = new Audio(
  "/237441__noisecollector__bulletimpact_wmrind3.wav"
);

export default function ChatWidget() {
  const user = useAuthStore((s) => s.user);
  const storedOpen = localStorage.getItem("chatOpen") === "true";
  const [open, setOpen] = useState(storedOpen ?? true);
  const [text, setText] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [sending, setSending] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { messages, fetchMessages, addMessage, sendMessage } = useChatStore();

  // 초기 메시지 로드 + 스크롤 최하단
  useEffect(() => {
    const loadLatest = async () => {
      await fetchMessages();
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    };
    loadLatest();
  }, []);

  // 실시간 메시지 수신
  useEffect(() => {
    const handleNewMessage = (msg: ChatMessage) => {
      addMessage(msg);
      audio.currentTime = 0;
      audio.play().catch(() => {});
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    };
    socket.on("chat:new", handleNewMessage);
    return () => socket.off("chat:new", handleNewMessage);
  }, [addMessage]);

  const send = async () => {
    if (!text.trim() || !user || sending) return;
    setSending(true);
    try {
      await sendMessage(text);
      socket.emit("chat:send", { userId: user.id, content: text });
      setText("");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      send();
    }
  };

  const toggleOpen = () => {
    setOpen((prev) => {
      const newOpen = !prev;
      localStorage.setItem("chatOpen", String(newOpen));
      return newOpen;
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
        width: open ? 300 : "auto",
      }}
    >
      <button
        onClick={toggleOpen}
        style={{
          padding: "8px 14px",
          background: "#4A90E2",
          color: "white",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
        }}
      >
        {open ? "채팅 닫기" : "채팅 열기"}
      </button>

      {open && (
        <div
          style={{
            marginTop: 10,
            width: 300,
            height: 350,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            ref={containerRef}
            style={{ flex: 1, padding: 10, overflowY: "auto", fontSize: 14 }}
          >
            {messages.map((m) => {
              const msgDate = new Date(m.createdAt);
              const time = msgDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              const isMine = m.userId === user?.id;

              return (
                <div key={m.id} style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMine ? "flex-end" : "flex-start",
                    }}
                  >
                    <b
                      style={{ alignSelf: isMine ? "flex-end" : "flex-start" }}
                    >
                      {m.user.nickname}
                    </b>
                    <div
                      style={{
                        maxWidth: "78%",
                        padding: "8px 12px",
                        borderRadius: 12,
                        background: isMine ? "#DCF8C6" : "#F1F1F1",
                        color: "#000",
                        whiteSpace: "pre-wrap",
                        boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
                      }}
                    >
                      {m.content}
                    </div>
                    <span style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                      {time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: 10,
              borderTop: "1px solid #eee",
              display: "flex",
              gap: 5,
            }}
          >
            <textarea
              style={{
                flex: 1,
                padding: 6,
                fontSize: 14,
                border: "1px solid #ccc",
                borderRadius: 6,
                resize: "none",
                height: 40,
                whiteSpace: "pre",
              }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="메시지 입력 (Shift+Enter: 줄바꿈)"
            />
            <button
              onClick={send}
              disabled={sending}
              style={{
                padding: "6px 10px",
                background: "#4A90E2",
                color: "white",
                borderRadius: 6,
                border: "none",
              }}
            >
              전송
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
