import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { User, Question, Category } from "../types";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import ChatWidget from "@/components/ChatWidget";
import AiChatWidget from "@/components/AiChatWidget";

export const MiniHome: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const highlightQuestionId = searchParams.get("question");
  const navigate = useNavigate();

  const { user: currentUser } = useAuthStore();

  const [homeOwner, setHomeOwner] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<"QUESTIONS" | "COMPLETED">(
    "QUESTIONS"
  );

  // Form States
  const [newQuestionTitle, setNewQuestionTitle] = useState("");
  const [newQuestionContent, setNewQuestionContent] = useState("");
  const [newCategory, setNewCategory] = useState<Category>(Category.DAILY);
  const [newAnswer, setNewAnswer] = useState("");

  // UI States
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(
    highlightQuestionId ? parseInt(highlightQuestionId) : null
  );
  const [loading, setLoading] = useState(true);

  // AI 답변 상태 추가
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<"short" | "long">("short");
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // 질문 수정 관련 상태
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(
    null
  );
  const [editingQuestionTitle, setEditingQuestionTitle] = useState("");
  const [editingQuestionContent, setEditingQuestionContent] = useState("");

  // 답변 수정 관련 상태
  const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);
  const [editingAnswerContent, setEditingAnswerContent] = useState("");

  const isOwner = currentUser?.id === parseInt(userId || "0");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const qRes = await api.get(`/questions/${userId}`);
        const data = qRes.data.data;
        setQuestions(data || []);

        if (data && data.length > 0) {
          setHomeOwner(data[0].author);
        } else {
          setHomeOwner({
            id: parseInt(userId!),
            nickname: `유저 ${userId}`,
            email: "",
            bio: "아직 작성된 글이 없습니다.",
          });
        }
      } catch (e) {
        console.error(e);
        setHomeOwner({
          id: parseInt(userId!),
          nickname: `User ${userId}`,
          email: "test@test.com",
          bio: "백엔드 연결 실패: Mock 데이터입니다.",
        });
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchData();
  }, [userId]);

  useEffect(() => {
    if (highlightQuestionId && questions.length > 0) {
      const el = document.getElementById(`question-${highlightQuestionId}`);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [highlightQuestionId, questions]);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: newQuestionTitle,
        content: newQuestionContent,
        category: newCategory,
      };
      const res = await api.post("/questions", payload);
      setQuestions([res.data.data, ...questions]);
      setShowQuestionForm(false);
      setNewQuestionTitle("");
      setNewQuestionContent("");
      alert("질문이 등록되었습니다!");
    } catch (e: any) {
      alert(e.response?.data?.message || "질문 등록 실패");
    }
  };

  const handleCreateAnswer = async (questionId: number) => {
    if (!newAnswer.trim()) return;
    try {
      const res = await api.post(`/questions/${questionId}/answers`, {
        content: newAnswer,
      });
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, answers: [...(q.answers || []), res.data.data] }
            : q
        )
      );
      setNewAnswer("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (e: any) {
      alert(e.response?.data?.message || "답변 등록 실패");
    }
  };

  const handleAdoptAnswer = async (questionId: number, answerId: number) => {
    if (
      !window.confirm(
        "이 답변을 채택하시겠습니까? 채택 후에는 변경할 수 없습니다."
      )
    )
      return;
    try {
      await api.patch(`/questions/${questionId}/complete`, { answerId });
      setQuestions(
        questions.map((q) => {
          if (q.id === questionId) {
            return {
              ...q,
              isCompleted: true,
              answers: q.answers?.map((a) =>
                a.id === answerId ? { ...a, isSelected: true } : a
              ),
            };
          }
          return q;
        })
      );
    } catch (e: any) {
      alert(e.response?.data?.message || "채택 실패");
    }
  };

  const displayedQuestions = questions.filter((q) =>
    activeTab === "COMPLETED" ? q.isCompleted : !q.isCompleted
  );

  const handleGenerateAIAnswer = async (
    questionId: number,
    type: "short" | "long"
  ) => {
    if (!currentUser) return;
    setAiLoading(true);
    try {
      const { data } = await api.post("/answers/ai/generate", {
        questionId,
        type,
      });
      setQuestions((qs) =>
        qs.map((q) =>
          q.id === questionId ? { ...q, aiAnswer: data.aiAnswer } : q
        )
      );
      setAiExpanded(false);
    } catch {
      alert("AI 답변 생성 실패");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAdoptAIAnswer = async (questionId: number) => {
    const q = questions.find((q) => q.id === questionId);
    if (!q?.aiAnswer) return;
    if (!window.confirm("이 AI 답변을 채택하시겠습니까?")) return;
    try {
      const { data: savedAnswer } = await api.post("/answers/ai/adopt", {
        questionId,
        content: q.aiAnswer,
        authorId: currentUser?.id,
      });
      setQuestions((qs) =>
        qs.map((q) =>
          q.id === questionId
            ? {
                ...q,
                isCompleted: true,
                aiAnswer: null,
                answers: [
                  ...(q.answers || []),
                  { ...savedAnswer, isSelected: true },
                ],
              }
            : q
        )
      );
    } catch {
      alert("AI 답변 채택 실패");
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleResize = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  };

  const handleCreate = (questionId: number) => {
    handleCreateAnswer(questionId);
    setNewAnswer("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  // 질문 수정 삭제
  const handleUpdateQuestion = async (
    questionId: number,
    title: string,
    content: string
  ) => {
    try {
      await api.patch(`/questions/${questionId}`, { title, content });
      setQuestions((qs) =>
        qs.map((q) => (q.id === questionId ? { ...q, title, content } : q))
      );
      alert("질문이 수정되었습니다.");
    } catch (err: any) {
      alert(err.response?.data?.message || "질문 수정 실패");
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!window.confirm("질문을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/questions/${questionId}`);
      setQuestions((qs) => qs.filter((q) => q.id !== questionId));
      alert("질문이 삭제되었습니다.");
    } catch (err: any) {
      alert(err.response?.data?.message || "질문 삭제 실패");
    }
  };

  // 답변 수정 삭제
  const handleUpdateAnswer = async (
    answerId: number,
    content: string,
    questionId: number
  ) => {
    try {
      await api.patch(`/questions/answers/${answerId}`, { content });
      setQuestions((qs) =>
        qs.map((q) =>
          q.id === questionId
            ? {
                ...q,
                answers: q.answers?.map((a) =>
                  a.id === answerId ? { ...a, content } : a
                ),
              }
            : q
        )
      );
      alert("답변이 수정되었습니다.");
    } catch (err: any) {
      alert(err.response?.data?.message || "답변 수정 실패");
    }
  };

  const handleDeleteAnswer = async (answerId: number, questionId: number) => {
    if (!window.confirm("답변을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/questions/answers/${answerId}`);
      setQuestions((qs) =>
        qs.map((q) =>
          q.id === questionId
            ? { ...q, answers: q.answers?.filter((a) => a.id !== answerId) }
            : q
        )
      );
      alert("답변이 삭제되었습니다.");
    } catch (err: any) {
      alert(err.response?.data?.message || "답변 삭제 실패");
    }
  };

  const handleQuestionEditSubmit = (questionId: number) => {
    if (!editingQuestionTitle.trim() || !editingQuestionContent.trim()) return;
    handleUpdateQuestion(
      questionId,
      editingQuestionTitle,
      editingQuestionContent
    );
    setEditingQuestionId(null);
    setEditingQuestionTitle("");
    setEditingQuestionContent("");
  };

  const handleAnswerEditSubmit = (answerId: number, questionId: number) => {
    if (!editingAnswerContent.trim()) return;
    handleUpdateAnswer(answerId, editingAnswerContent, questionId);
    setEditingAnswerId(null);
    setEditingAnswerContent("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
      {/* Profile Sidebar (Left) */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
          <div className="h-24 bg-gradient-to-r from-indigo-400 to-purple-400"></div>
          <div className="px-6 pb-6 text-center relative">
            <div className="w-20 h-20 bg-white p-1 rounded-full mx-auto -mt-10 mb-3 shadow-md">
              <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500 uppercase">
                {homeOwner?.nickname?.[0]}
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {homeOwner?.nickname}
            </h2>
            <p className="text-gray-500 text-xs mb-4">{homeOwner?.email}</p>

            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 italic border border-gray-100">
              "{homeOwner?.bio || "자기소개가 없습니다."}"
            </div>

            <div className="mt-6 flex justify-between text-xs text-gray-500 border-t pt-4">
              <div className="flex flex-col">
                <span className="font-bold text-lg text-indigo-600">
                  {questions.filter((q) => !q.isCompleted).length}
                </span>
                <span>진행중</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-green-600">
                  {questions.filter((q) => q.isCompleted).length}
                </span>
                <span>해결됨</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content (Right) */}
      <div className="lg:col-span-9 space-y-6">
        {/* Navigation & Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex p-1 bg-gray-100 rounded-lg w-full sm:w-auto mb-4 sm:mb-0">
            <button
              onClick={() => setActiveTab("QUESTIONS")}
              className={`flex-1 sm:flex-none px-6 py-2 text-sm font-bold rounded-md transition-all ${
                activeTab === "QUESTIONS"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              질문 목록
            </button>
            <button
              onClick={() => setActiveTab("COMPLETED")}
              className={`flex-1 sm:flex-none px-6 py-2 text-sm font-bold rounded-md transition-all ${
                activeTab === "COMPLETED"
                  ? "bg-white text-green-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              해결된 질문 목록
            </button>
          </div>

          {isOwner && (
            <button
              onClick={() => setShowQuestionForm(!showQuestionForm)}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors ${
                showQuestionForm
                  ? "bg-gray-200 text-gray-700"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {showQuestionForm ? "닫기" : "✏️ 질문하기"}
            </button>
          )}
        </div>

        {/* Create Question Form */}
        {showQuestionForm && isOwner && (
          <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 animate-fade-in relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl"></div>
            <h3 className="text-lg font-bold mb-4 text-gray-800">
              새로운 질문 작성
            </h3>
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    카테고리
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Category)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border bg-gray-50 text-sm"
                  >
                    {Object.values(Category).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    제목
                  </label>
                  <input
                    type="text"
                    required
                    value={newQuestionTitle}
                    onChange={(e) => setNewQuestionTitle(e.target.value)}
                    placeholder="궁금한 내용을 요약해주세요"
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border bg-gray-50 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  상세 내용
                </label>
                <textarea
                  required
                  rows={4}
                  value={newQuestionContent}
                  onChange={(e) => setNewQuestionContent(e.target.value)}
                  placeholder="상황을 자세히 설명하면 더 좋은 답변을 받을 수 있어요!"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border bg-gray-50 text-sm"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg hover:bg-indigo-700 font-bold shadow-sm text-sm"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Question List */}
        <div className="space-y-4">
          {displayedQuestions.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <span className="text-4xl mb-4">📭</span>
              <p className="text-gray-500 font-medium">
                아직 등록된 질문이 없습니다.
              </p>
            </div>
          )}

          {displayedQuestions.map((q) => (
            <div
              id={`question-${q.id}`}
              key={q.id}
              className={`bg-white rounded-xl shadow-sm border transition-all duration-200 ${
                expandedQuestion === q.id
                  ? "ring-2 ring-indigo-100 border-indigo-300"
                  : "border-gray-200 hover:border-indigo-200"
              }`}
            >
              {/* Card Header (Clickable) */}
              <div
                className="p-5 cursor-pointer relative"
                onClick={() =>
                  setExpandedQuestion(expandedQuestion === q.id ? null : q.id)
                }
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        q.isCompleted
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {q.category}
                    </span>
                    {q.isCompleted && (
                      <span className="text-green-600 text-xs font-bold flex items-center">
                        ✓ 해결됨
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1 flex justify-between items-center">
                  {editingQuestionId === q.id ? (
                    <input
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                      value={editingQuestionTitle}
                      onChange={(e) => setEditingQuestionTitle(e.target.value)}
                    />
                  ) : (
                    q.title
                  )}
                  {isOwner && (
                    <div className="ml-2 text-gray-400 text-xs space-x-2">
                      {editingQuestionId !== q.id && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingQuestionId(q.id);
                              setEditingQuestionTitle(q.title);
                              setEditingQuestionContent(q.content);
                            }}
                          >
                            수정
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuestion(q.id);
                            }}
                          >
                            삭제
                          </button>
                        </>
                      )}
                      {editingQuestionId === q.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuestionEditSubmit(q.id);
                          }}
                        >
                          완료
                        </button>
                      )}
                    </div>
                  )}
                </h3>

                <p
                  className={`text-gray-600 text-sm ${
                    expandedQuestion === q.id ? "" : "line-clamp-1"
                  }`}
                >
                  {editingQuestionId === q.id ? (
                    <textarea
                      className="border border-gray-300 rounded w-full px-2 py-1 text-sm"
                      value={editingQuestionContent}
                      onChange={(e) =>
                        setEditingQuestionContent(e.target.value)
                      }
                    />
                  ) : (
                    expandedQuestion !== q.id && q.content
                  )}
                </p>

                <div className="mt-3 flex items-center text-xs text-gray-400 gap-4">
                  <span className="flex items-center gap-1">
                    💬 답변 {q.answers?.length || 0}
                  </span>
                </div>
              </div>

              {/* Expanded Content (기존 AI + 답변 + 입력) */}
              {expandedQuestion === q.id && (
                <div className="border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                  <div className="p-5 bg-white border-b border-gray-100">
                    <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                      {editingQuestionId === q.id
                        ? editingQuestionContent
                        : q.content}
                    </p>
                  </div>

                  {/* AI 영역 */}
                  <div className="p-5 mt-2">
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-sm font-semibold text-yellow-500">
                        AI
                      </span>
                      <div className="flex gap-2">
                        <button
                          className="px-2 py-1 rounded text-white text-xs bg-yellow-600 hover:bg-yellow-700 font-medium tracking-wide flex items-center justify-center gap-1"
                          onClick={() => handleGenerateAIAnswer(q.id, "short")}
                          disabled={aiLoading || q.isCompleted}
                        >
                          {aiLoading && (
                            <svg
                              className="animate-spin h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                              ></path>
                            </svg>
                          )}
                          요약
                        </button>

                        <button
                          className="px-2 py-1 rounded text-white text-xs bg-yellow-600 hover:bg-yellow-700 font-medium tracking-wide flex items-center justify-center gap-1"
                          onClick={() => handleGenerateAIAnswer(q.id, "long")}
                          disabled={aiLoading || q.isCompleted}
                        >
                          {aiLoading && (
                            <svg
                              className="animate-spin h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                              ></path>
                            </svg>
                          )}
                          자세히
                        </button>
                      </div>
                    </div>

                    {q.aiAnswer && (
                      <div className="mt-2 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                        {aiExpanded
                          ? q.aiAnswer
                          : q.aiAnswer.split("\n").slice(0, 3).join("\n")}
                        {q.aiAnswer.split("\n").length > 3 && (
                          <button
                            className="ml-2 text-blue-600 underline text-xs"
                            onClick={() => setAiExpanded(!aiExpanded)}
                          >
                            {aiExpanded ? "접기" : "더보기"}
                          </button>
                        )}
                      </div>
                    )}

                    {q.aiAnswer &&
                      !q.isCompleted &&
                      !q.answers?.some((a) => a.isSelected) && (
                        <button
                          onClick={() => handleAdoptAIAnswer(q.id)}
                          className="mt-2 px-3 py-1 rounded bg-blue-700 text-white text-xs hover:bg-blue-800"
                        >
                          채택
                        </button>
                      )}
                  </div>

                  {/* 답변 목록 */}
                  <div className="p-5">
                    <h4 className="font-bold text-sm text-gray-700 mb-4 flex items-center gap-2">
                      답변 목록{" "}
                      <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {q.answers?.length || 0}
                      </span>
                    </h4>
                  </div>

                  <div className="space-y-4 p-3 mt-5">
                    {q.answers && q.answers.length > 0 ? (
                      q.answers.map((a) => (
                        <div
                          key={a.id}
                          className={`p-4 rounded-xl border relative ${
                            a.isSelected
                              ? "bg-green-50 border-green-200 shadow-sm"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                                {a.author?.nickname?.[0]}
                              </div>
                              <span className="font-bold text-sm text-gray-800">
                                {a.author?.nickname || "익명"}
                              </span>
                            </div>
                            <div className="ml-2 text-gray-400 text-xs space-x-2">
                              {editingAnswerId !== a.id &&
                                a.author?.id === currentUser?.id && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingAnswerId(a.id);
                                        setEditingAnswerContent(a.content);
                                      }}
                                    >
                                      수정
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteAnswer(a.id, q.id)
                                      }
                                    >
                                      삭제
                                    </button>
                                  </>
                                )}
                              {editingAnswerId === a.id && (
                                <button
                                  onClick={() =>
                                    handleAnswerEditSubmit(a.id, q.id)
                                  }
                                >
                                  완료
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed pl-8 whitespace-pre-wrap">
                            {editingAnswerId === a.id ? (
                              <textarea
                                className="border border-gray-300 rounded w-full px-2 py-1 text-sm"
                                value={editingAnswerContent}
                                onChange={(e) =>
                                  setEditingAnswerContent(e.target.value)
                                }
                              />
                            ) : (
                              a.content
                            )}
                          </p>

                          {!q.isCompleted &&
                            isOwner &&
                            editingAnswerId !== a.id && (
                              <div className="mt-3 pl-8 flex justify-end">
                                <button
                                  onClick={() => handleAdoptAnswer(q.id, a.id)}
                                  className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-100 transition-colors"
                                >
                                  이 답변 채택하기
                                </button>
                              </div>
                            )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 bg-white rounded-lg border border-gray-200 border-dashed">
                        <span className="text-2xl block mb-2">🤔</span>
                        <p className="text-sm text-gray-500">
                          아직 등록된 답변이 없습니다.
                          <br />첫 번째 답변을 남겨보세요!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Answer Input */}
                  {currentUser &&
                    !q.isCompleted &&
                    editingAnswerId === null && (
                      <div className="mt-6">
                        <div className="flex gap-2 bg-white p-2 rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all shadow-sm">
                          <textarea
                            ref={textareaRef}
                            value={newAnswer}
                            onChange={(e) => {
                              setNewAnswer(e.target.value);
                              handleResize();
                            }}
                            placeholder="도움이 되는 답변을 남겨주세요..."
                            className="flex-1 px-3 py-2 text-sm focus:outline-none bg-transparent resize-none overflow-hidden"
                            rows={1}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleCreate(q.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleCreate(q.id)}
                            disabled={!newAnswer.trim()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
                          >
                            등록
                          </button>
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <ChatWidget />
      <AiChatWidget />
    </div>
  );
};
