export interface Subject {
  id: string;
  name: string;
  shortName: string;
  color: string;
  icon: string;
}

export interface Exercise {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isSimulado: boolean;
  questions: Question[];
  createdAt: Date;
  lastReviewedAt?: Date;
  nextReviewAt: Date;
  reviewCount: number;
  successRate: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface StudySession {
  id: string;
  exerciseId: string;
  completedAt: Date;
  score: number;
  timeSpent: number;
  answersLog: AnswerLog[];
}

export interface AnswerLog {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

export interface ReviewSchedule {
  exerciseId: string;
  interval: number; // dias
  nextReview: Date;
  difficulty: number; // fator de dificuldade
}