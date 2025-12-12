import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import ChatWidget from "@/components/ChatWidget";

interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: { id: number; nickname: string };
}

const PostsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const fetchPost = async () => {
    const res = await api.get(`/posts/${id}`);
    setPost(res.data.data);
    setTitle(res.data.data.title);
    setContent(res.data.data.content);
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleUpdate = async () => {
    await api.patch(`/posts/${id}`, { title, content });
    alert("게시글이 수정되었습니다.");
    setEditing(false);
    fetchPost();
  };

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await api.delete(`/posts/${id}`);
    alert("게시글이 삭제되었습니다.");
    navigate("/posts");
  };

  if (!post) return <div className="text-center py-10">로딩중...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-200 space-y-6">
      {editing ? (
        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="제목을 입력하세요"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="내용을 입력하세요"
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleUpdate}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              수정 완료
            </button>
            <button
              onClick={() => setEditing(false)}
              className="bg-gray-300 text-gray-800 px-5 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">{post.title}</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
          <div className="flex justify-between items-center border-t pt-2 text-gray-400 text-sm">
            <span>작성자: {post.author.nickname}</span>
            <span>{new Date(post.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => setEditing(true)}
              className="bg-gray-200 text-gray-700 px-4 py-1 rounded-lg hover:bg-gray-300 transition"
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              className="bg-gray-200 text-gray-700 px-4 py-1 rounded-lg hover:bg-gray-300 transition"
            >
              삭제
            </button>
          </div>
        </div>
      )}
      <ChatWidget />
    </div>
  );
};

export default PostsDetail;
