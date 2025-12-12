import { useEffect, useRef, useState } from "react";
import { useAiChatStore } from "../store/aiChatStore";
import { useAuthStore } from "../store/authStore";
import { io } from "socket.io-client";

export default function AiChatWidget() {
  const user = useAuthStore((s) => s.user);

  const storedExpanded = localStorage.getItem("aiChatExpanded") === "true";
  const storedOpen = localStorage.getItem("aiChatOpen") === "true";
  const [expanded, setExpanded] = useState(storedExpanded ?? true);
  const [open, setOpen] = useState(storedOpen ?? true);
  const [text, setText] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<any>(null);

  const { messages, loading, error, fetchMessages, sendMessage, addMessage } =
    useAiChatStore();

  // 초기 메시지 로드 + 소켓 연결
  useEffect(() => {
    if (!user) return;

    fetchMessages();

    const socket = io("http://220.93.220.93:3001", { withCredentials: true });
    socket.emit("joinAiRoom", user.id);
    socketRef.current = socket;

    socket.on("ai:new", (msg) => {
      addMessage(msg);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // 메시지 변경 시 스크롤 최하단
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // 채팅창 열림 상태 변경 시 스크롤 최하단
  useEffect(() => {
    if (open && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [open]);

  const handleSend = async () => {
    if (!text.trim() || loading || !user) return;

    const userMsg = {
      id: Date.now(),
      userId: user.id,
      role: "user" as const,
      content: text,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMsg);
    setText("");

    try {
      await sendMessage(text);
    } catch (err) {
      console.error("메시지 전송 실패:", err);
    }
  };

  const toggleExpanded = () => {
    setExpanded((p) => {
      localStorage.setItem("aiChatExpanded", String(!p));
      return !p;
    });
  };

  const toggleOpen = () => {
    setOpen((p) => {
      const newOpen = !p;
      localStorage.setItem("aiChatOpen", String(newOpen));

      // 열었을 때 스크롤 최하단
      if (newOpen && containerRef.current) {
        setTimeout(() => {
          containerRef.current!.scrollTop = containerRef.current!.scrollHeight;
        }, 0);
      }

      return newOpen;
    });
  };

  const width = expanded ? 600 : 320;
  const height = expanded ? 600 : 380;

  return (
    <div
      style={{ position: "fixed", bottom: 20, left: 20, width, zIndex: 9999 }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={toggleOpen}
          style={{
            padding: "8px 14px",
            background: "#10B981",
            color: "white",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          {open ? "AI 채팅 닫기" : "AI"}
        </button>
        {open && (
          <button
            onClick={toggleExpanded}
            style={{
              padding: "8px 14px",
              background: "#3B82F6",
              color: "white",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
            }}
          >
            {expanded ? "축소" : "확대"}
          </button>
        )}
      </div>

      {open && (
        <div
          style={{
            marginTop: 10,
            width,
            height,
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
            style={{ flex: 1, padding: 12, overflowY: "auto", fontSize: 14 }}
          >
            {loading && <div>로딩 중...</div>}
            {error && <div style={{ color: "red" }}>{error}</div>}

            {messages.map((m, i) => {
              const msgDate = new Date(m.createdAt);
              const time = msgDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              const dateStr = msgDate.toLocaleDateString();
              const showDate =
                i === 0 ||
                new Date(messages[i - 1].createdAt).toDateString() !==
                  msgDate.toDateString();

              return (
                <div key={m.id} style={{ marginBottom: 10 }}>
                  {showDate && (
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: 12,
                        color: "#888",
                        marginBottom: 6,
                      }}
                    >
                      {dateStr}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: m.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "78%",
                        padding: "8px 12px",
                        borderRadius: 12,
                        background: m.role === "user" ? "#DCF8C6" : "#F1F1F1",
                        color: "#000",
                        whiteSpace: "pre-wrap",
                        boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
                      }}
                    >
                      {m.content}
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#888",
                        marginTop: 2,
                      }}
                    >
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
              gap: 8,
              alignItems: "center",
            }}
          >
            <textarea
              style={{
                flex: 1,
                padding: 8,
                fontSize: 14,
                border: "1px solid #ccc",
                borderRadius: 6,
                resize: "none",
                height: 48,
              }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isComposing) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="질문 입력 (Shift+Enter: 줄바꿈)"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              style={{
                padding: "8px 12px",
                background: loading ? "#9CA3AF" : "#10B981",
                color: "white",
                borderRadius: 6,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              disabled={loading}
            >
              {loading ? "전송 중…" : "전송"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
