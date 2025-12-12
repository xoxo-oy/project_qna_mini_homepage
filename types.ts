
export enum Category {
  DAILY = 'DAILY',
  TECH = 'TECH',
  RELATIONSHIP = 'RELATIONSHIP',
  HOBBY = 'HOBBY',
  CAREER = 'CAREER'
}

export interface User {
  id: number;
  email: string;
  nickname: string;
  avatarUrl?: string;
  bio?: string;
}

export interface Answer {
  id: number;
  content: string;
  questionId: number;
  authorId: number;
  author?: User;
  isSelected: boolean; // Adopted answer
  createdAt: string;
}

export interface Question {
  id: number;
  title: string;
  content: string;
  category: Category;
  authorId: number;
  author?: User;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  answers?: Answer[];
  _count?: {
    answers: number;
  }
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export interface PaginatedResponse<T> {
  questions: T[];
  total: number;
  totalPages: number;
}
