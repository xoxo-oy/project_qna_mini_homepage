import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import ChatWidget from "@/components/ChatWidget";
import AiChatWidget from "@/components/AiChatWidget";

const PostsNew: React.FC = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    await api.post("/posts", { title, content });
    alert("게시글이 생성되었습니다.");
    navigate("/posts");
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold">새 게시글 작성</h2>
      <input
        type="text"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <textarea
        placeholder="내용"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        className="w-full p-2 border rounded"
      />
      <button
        onClick={handleSubmit}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        등록
      </button>
      <ChatWidget />
      <AiChatWidget />
    </div>
  );
};

export default PostsNew;
