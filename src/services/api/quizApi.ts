import httpClient from "../httpClient";
import type { Quiz, QuizAdminSummary, QuizLeaderboardEntry, QuizSubmitResult } from "../../types/quiz";

export interface QuizUpsertPayload {
  title: string;
  slug: string;
  description?: string;
  type: string;
  isGraded: boolean;
  isActive: boolean;
  startAt?: string | null;
  endAt?: string | null;
}

export interface QuestionUpsertPayload {
  prompt: string;
  imageUrl?: string;
  audioUrl?: string;
  explanation?: string;
  sortOrder: number;
  points: number;
  isActive: boolean;
}

export interface OptionUpsertPayload {
  text: string;
  imageUrl?: string;
  sortOrder: number;
  isCorrect: boolean;
}

export const quizApi = {
  getActiveQuiz: async (type = "daily") => {
    const { data } = await httpClient.get<Quiz | { message: string }>("/quizzes/active", { params: { type } });
    return data;
  },

  getActiveQuizzes: async () => {
    const { data } = await httpClient.get<Quiz[] | { message: string }>("/quizzes/active-list");
    return data;
  },

  getQuizById: async (quizId: number) => {
    const { data } = await httpClient.get<Quiz>(`/quizzes/${quizId}`);
    return data;
  },

  submitAttempt: async (quizId: number, answers: Array<{ questionId: number; answerOptionId: number }>) => {
    const { data } = await httpClient.post<QuizSubmitResult>(`/quizzes/${quizId}/submit`, { answers });
    return data;
  },

  getLeaderboard: async (graded: boolean, top = 20) => {
    const { data } = await httpClient.get<QuizLeaderboardEntry[]>("/quizzes/leaderboard", { params: { graded, top } });
    return data;
  },

  adminList: async () => {
    const { data } = await httpClient.get<QuizAdminSummary[]>("/admin/quizzes");
    return data;
  },

  adminGetQuiz: async (quizId: number) => {
    const { data } = await httpClient.get<Quiz>(`/admin/quizzes/${quizId}`);
    return data;
  },

  adminCreateQuiz: async (payload: QuizUpsertPayload) => {
    const { data } = await httpClient.post<Quiz>("/admin/quizzes", payload);
    return data;
  },

  adminUpdateQuiz: async (quizId: number, payload: QuizUpsertPayload) => {
    const { data } = await httpClient.put<Quiz>(`/admin/quizzes/${quizId}`, payload);
    return data;
  },

  adminDeleteQuiz: async (quizId: number) => {
    const { data } = await httpClient.delete<string>(`/admin/quizzes/${quizId}`);
    return data;
  },

  adminSetPublished: async (quizId: number, isPublished: boolean) => {
    const { data } = await httpClient.patch<Quiz>(`/admin/quizzes/${quizId}/publish`, { isPublished });
    return data;
  },

  adminCreateQuestion: async (quizId: number, payload: QuestionUpsertPayload) => {
    const { data } = await httpClient.post(`/admin/quizzes/${quizId}/questions`, payload);
    return data;
  },

  adminUpdateQuestion: async (questionId: number, payload: QuestionUpsertPayload) => {
    const { data } = await httpClient.put(`/admin/quizzes/questions/${questionId}`, payload);
    return data;
  },

  adminDeleteQuestion: async (questionId: number) => {
    const { data } = await httpClient.delete(`/admin/quizzes/questions/${questionId}`);
    return data;
  },

  adminCreateOption: async (questionId: number, payload: OptionUpsertPayload) => {
    const { data } = await httpClient.post(`/admin/quizzes/questions/${questionId}/options`, payload);
    return data;
  },

  adminUpdateOption: async (optionId: number, payload: OptionUpsertPayload) => {
    const { data } = await httpClient.put(`/admin/quizzes/options/${optionId}`, payload);
    return data;
  },

  adminDeleteOption: async (optionId: number) => {
    const { data } = await httpClient.delete(`/admin/quizzes/options/${optionId}`);
    return data;
  },
};
