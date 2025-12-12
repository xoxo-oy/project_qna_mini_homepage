import React from "react";
import { Question, Category } from "../types";
import { Link, useLocation } from "react-router-dom";

interface PostItProps {
  question: Question;
}

const categoryColors: Record<Category, string> = {
  [Category.DAILY]: "bg-postit-yellow",
  [Category.TECH]: "bg-postit-blue",
  [Category.RELATIONSHIP]: "bg-postit-pink",
  [Category.HOBBY]: "bg-postit-green",
  [Category.CAREER]: "bg-purple-100",
};

export const PostIt: React.FC<PostItProps> = ({ question }) => {
  const rotation = Math.floor(Math.random() * 6) - 3;

  // 해결된 질문이면 tab=solved 쿼리 추가
  const linkTo = `/minihome/${question.authorId}?question=${question.id}${
    question.isCompleted ? "&tab=solved" : ""
  }`;

  return (
    <Link
      to={linkTo}
      className={`block p-4 shadow-lg transition-transform hover:scale-105 hover:z-10 h-64 flex flex-col justify-between ${
        categoryColors[question.category] || "bg-white"
      }`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold uppercase tracking-wider opacity-60 text-gray-800 border border-gray-800 px-1 rounded">
            {question.category}
          </span>
          {question.isCompleted && (
            <span className="text-xs font-bold text-green-700">✓ Solved</span>
          )}
        </div>
        <h3 className="text-xl font-sans font-bold text-gray-900 mb-2 leading-tight line-clamp-3">
          {question.title}
        </h3>
        <p className="text-sm font-sans text-gray-700 line-clamp-4">
          {question.content}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-gray-400/20 pt-2">
        <span className="text-xs font-medium text-gray-600">
          {question.author?.nickname || "Anonymous"}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(question.createdAt).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );
};
