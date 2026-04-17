export interface QuizOption {
  id: number;
  text: string;
  imageUrl?: string | null;
  sortOrder: number;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: number;
  prompt: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  explanation?: string | null;
  sortOrder: number;
  points: number;
  options: QuizOption[];
}

export interface Quiz {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  type: string;
  isGraded: boolean;
  isPublished: boolean;
  isActive: boolean;
  startAt?: string | null;
  endAt?: string | null;
  questions: QuizQuestion[];
  hasCompletedFirstAttempt: boolean;
  attemptCount: number;
}

export interface QuizAdminSummary {
  id: number;
  title: string;
  slug: string;
  type: string;
  isGraded: boolean;
  isPublished: boolean;
  isActive: boolean;
  startAt?: string | null;
  endAt?: string | null;
  questionCount: number;
}

export interface QuizSubmitResult {
  id: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  currencyAwarded: number;
  currencyBalance: number;
  isScoreCounted: boolean;
  message: string;
}

export interface QuizLeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  totalScore: number;
  totalCorrectAnswers: number;
  attemptsCount: number;
}
