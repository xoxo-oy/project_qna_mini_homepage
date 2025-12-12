// AiChatStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";
import { io } from "socket.io-client";
import { useAuthStore } from "./authStore";

export interface AiChatMessage {
  id: number;
  userId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  responseId?: string | null;
}

interface AiChatStore {
  messages: AiChatMessage[];
  loading: boolean;
  error: string | null;
  fetchMessages: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  addMessage: (msg: AiChatMessage) => void;
}

export const useAiChatStore = create<AiChatStore>()(
  persist(
    (set, get) => {
      const user = useAuthStore.getState().user;
      let socket: ReturnType<typeof io> | null = null;

      if (user && typeof window !== "undefined") {
        socket = io("http://220.93.220.93:3001", { withCredentials: true });
        socket.emit("joinAiRoom", user.id);

        socket.on("ai:new", (msg: AiChatMessage) => {
          get().addMessage(msg);
        });
      }

      return {
        messages: [],
        loading: false,
        error: null,

        fetchMessages: async () => {
          set({ loading: true, error: null });
          try {
            const res = await api.get("/ai-chat");
            set({ messages: res.data, loading: false });
          } catch (err: any) {
            console.error("Failed to fetch AI messages:", err);
            set({ loading: false, error: "메시지 불러오기 실패" });
          }
        },

        sendMessage: async (content: string) => {
          set({ loading: true, error: null });
          try {
            await api.post("/ai-chat", { content });
            // socket 이벤트가 assistant 메시지를 가져오기 때문에 여기서는 append하지 않음
          } catch (err) {
            console.error("Failed to send AI message:", err);
            set({ error: "메시지 전송 실패" });
          } finally {
            set({ loading: false });
          }
        },

        addMessage: (msg: AiChatMessage) => {
          set({ messages: [...get().messages, msg] });
        },
      };
    },
    { name: "ai-chat-storage" }
  )
);
