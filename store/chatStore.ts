import { create } from "zustand";
import api from "../services/api";

export interface ChatMessage {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  user: { nickname: string };
}

interface ChatStore {
  messages: ChatMessage[];
  loading: boolean;

  fetchMessages: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  addMessage: (msg: ChatMessage) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  loading: false,

  // 최신 20개 메시지 불러오기
  fetchMessages: async () => {
    set({ loading: true });
    try {
      const res = await api.get(`/chat?limit=20`);
      const newMsgs: ChatMessage[] = res.data;
      set({ messages: newMsgs, loading: false });
    } catch (e) {
      console.error("메시지 불러오기 실패", e);
      set({ loading: false });
    }
  },

  // 메시지 전송
  sendMessage: async (content: string) => {
    try {
      const res = await api.post("/chat", { content });
      const newMsg: ChatMessage = res.data;
      set({ messages: [...get().messages, newMsg].slice(-20) }); // 항상 최신 20개 유지
    } catch (e) {
      console.error("메시지 전송 실패", e);
    }
  },

  // socket.io 실시간 수신
  addMessage: (msg: ChatMessage) => {
    set({ messages: [...get().messages, msg].slice(-20) }); // 최신 20개만 유지
  },
}));
