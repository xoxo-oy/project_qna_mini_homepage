import React, { useEffect, useState } from "react";
import { PostIt } from "../components/PostIt";
import { Question, Category } from "../types";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ChatWidget from "@/components/ChatWidget";
import AiChatWidget from "@/components/AiChatWidget";

export const Dashboard: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Category | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  /** 미해결 질문만 가져오기 */
  const fetchQuestions = async (customPage?: number) => {
    setLoading(true);
    try {
      const res = await api.get("/questions", {
        params: {
          page: customPage ?? page,
          limit: 15,
          category: filter,
          search: search || undefined,
          isCompleted: false, // 미해결만
        },
      });
      const data = res.data.data;
      setQuestions(data.questions);
      setTotalPages(data.totalPages ?? 1);
      if ((customPage ?? page) > data.totalPages) setPage(data.totalPages);
    } catch {
      console.warn("Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [filter, page]);

  useEffect(() => {
    if (location.pathname === "/") {
      setPage(1);
      fetchQuestions(1);
    }
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQuestions(1);
  };

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 font-hand">
            Today's Questions
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            고민을 해결하고 도토리를 모아보세요!
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="관심있는 키워드를 검색해보세요..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:border-indigo-400 transition-colors"
          />
          <button
            type="submit"
            className="absolute right-3 top-2.5 text-gray-400 hover:text-indigo-600"
          >
            🔍
          </button>
        </form>
      </div>

      {/* Category Filter + 해결 질문 버튼 */}
      <div className="flex flex-wrap gap-2 justify-center items-center">
        <button
          onClick={() => {
            setFilter("ALL");
            setPage(1);
          }}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            filter === "ALL"
              ? "bg-gray-800 text-white shadow-lg scale-105"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          전체보기
        </button>
        {Object.values(Category).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setFilter(cat);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              filter === cat
                ? "bg-indigo-500 text-white shadow-lg scale-105"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {cat}
          </button>
        ))}

        {/* 해결 질문 버튼 */}
        <button
          onClick={() => navigate("/career-solved")}
          className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
        >
          ✅ 해결 질문
        </button>
      </div>

      {/* Questions Grid */}
      {loading ? (
        <div className="flex justify-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-2">
          {user && (
            <Link
              to={`/minihome/${user.id}`}
              className="group block border-2 border-dashed border-gray-300 rounded-lg p-4 h-64 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition-all hover:bg-white hover:shadow-md"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                <span className="text-4xl text-indigo-400">+</span>
              </div>
              <span className="font-bold text-lg">질문 등록하기</span>
              <span className="text-xs mt-2">내 미니홈피로 이동합니다</span>
            </Link>
          )}
          {questions.map((q) => (
            <PostIt key={q.id} question={q} />
          ))}
          {questions.length === 0 && !loading && (
            <div className="col-span-full text-center py-10 text-gray-500">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 pb-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded bg-white border border-gray-200 disabled:opacity-50 hover:bg-gray-50 text-sm font-medium"
          >
            이전
          </button>
          <span className="px-4 py-2 font-bold text-gray-700 flex items-center bg-white rounded border border-gray-100">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded bg-white border border-gray-200 disabled:opacity-50 hover:bg-gray-50 text-sm font-medium"
          >
            다음
          </button>
        </div>
      )}

      <ChatWidget />
      <AiChatWidget />
    </div>
  );
};
