import React, { useEffect, useState } from "react";
import { PostIt } from "../components/PostIt";
import { Question } from "../types";
import api from "../services/api";

export const CareerSolved: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchQuestions = async (customPage?: number) => {
    setLoading(true);
    try {
      const res = await api.get("/questions", {
        params: {
          page: customPage ?? page,
          limit: 15,
          isCompleted: true, // 해결 질문만
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
  }, [page]);

  return (
    <div className="space-y-8 relative">
      <h1 className="text-3xl font-bold text-center my-6">✅ 해결 질문</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-2">
        {questions.map((q) => (
          <PostIt key={q.id} question={q} />
        ))}
        {questions.length === 0 && !loading && (
          <div className="col-span-full text-center py-10 text-gray-500">
            해결된 질문이 없습니다.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 pb-8 mt-4">
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
    </div>
  );
};
