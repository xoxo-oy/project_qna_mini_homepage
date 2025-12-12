import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: { id: number; nickname: string };
}

const Posts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const { user, isAuthenticated } = useAuthStore();

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");

  const showToast = (message: string) => {
    alert(message); // 간단하게 alert 사용, 나중에 토스트 UI로 교체 가능
  };

  const fetchPosts = async () => {
    try {
      const res = await api.get("/posts");
      setPosts(res.data.data);
    } catch (err) {
      console.error("게시글 불러오기 실패", err);
    }
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      await api.post("/posts", { title: newTitle, content: newContent });
      showToast("게시글이 등록되었습니다.");
      setNewTitle("");
      setNewContent("");
      fetchPosts();
    } catch (err) {
      console.error("게시글 생성 실패", err);
    }
  };

  const handleUpdatePost = async (postId: number) => {
    if (!editingTitle.trim() || !editingContent.trim()) return;
    try {
      await api.patch(`/posts/${postId}`, {
        title: editingTitle,
        content: editingContent,
      });
      showToast("게시글이 수정되었습니다.");
      setEditingPostId(null);
      setEditingTitle("");
      setEditingContent("");
      fetchPosts();
    } catch (err) {
      console.error("게시글 수정 실패", err);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm("게시글을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/posts/${postId}`);
      showToast("게시글이 삭제되었습니다.");
      fetchPosts();
    } catch (err) {
      console.error("게시글 삭제 실패", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="space-y-6">
      {isAuthenticated && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-bold mb-4">새 게시글 작성</h3>
          <input
            type="text"
            placeholder="제목"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full p-2 mb-2 border rounded-md"
          />
          <textarea
            placeholder="내용"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full p-2 mb-2 border rounded-md"
            rows={4}
          />
          <button
            onClick={handleCreatePost}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            등록
          </button>
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            {editingPostId === post.id ? (
              <>
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="w-full p-2 mb-2 border rounded-md"
                />
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full p-2 mb-2 border rounded-md"
                  rows={4}
                />
                <button
                  onClick={() => handleUpdatePost(post.id)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  완료
                </button>
                <button
                  onClick={() => setEditingPostId(null)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <h4 className="font-bold text-lg">{post.title}</h4>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {post.content}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  작성자: {post.author.nickname} |{" "}
                  {new Date(post.createdAt).toLocaleString()}
                </p>
                {user?.id === post.author.id && (
                  <div className="mt-2 space-x-2">
                    <button
                      onClick={() => {
                        setEditingPostId(post.id);
                        setEditingTitle(post.title);
                        setEditingContent(post.content);
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Posts;
