import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import ChatWidget from "@/components/ChatWidget";
import AiChatWidget from "@/components/AiChatWidget";

interface Post {
  id: number;
  title: string;
  createdAt: string;
  author: { id: number; nickname: string };
}

const PostsList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchPosts = async (pageNumber: number = 1) => {
    const res = await api.get(`/posts?page=${pageNumber}&limit=10`);
    setPosts(res.data.data);
    setPage(res.data.page);
    setTotalPages(res.data.totalPages);
  };

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  return (
    <div className="space-y-4">
      <button
        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 mb-4"
        onClick={() => navigate("/posts/new")}
      >
        새 게시글 작성
      </button>

      {posts.map((post) => (
        <div
          key={post.id}
          className="p-4 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
          onClick={() => navigate(`/posts/${post.id}`)}
        >
          <h4 className="font-bold">{post.title}</h4>
          <p className="text-xs text-gray-400">
            작성자: {post.author.nickname} |{" "}
            {new Date(post.createdAt).toLocaleString()}
          </p>
        </div>
      ))}

      <div className="flex space-x-2 mt-4">
        <button
          disabled={page <= 1}
          onClick={() => fetchPosts(page - 1)}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          이전
        </button>
        <span className="px-2 py-1">
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => fetchPosts(page + 1)}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          다음
        </button>
      </div>
      <ChatWidget />
      <AiChatWidget />
    </div>
  );
};

export default PostsList;
