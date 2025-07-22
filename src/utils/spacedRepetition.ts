// Algoritmo de Repetição Espaçada baseado no SM-2
export interface ReviewData {
  interval: number;
  repetitions: number;
  easinessFactor: number;
  nextReviewDate: Date;
}

export const calculateNextReview = (
  quality: number, // 0-5 (0 = falhou completamente, 5 = perfeito)
  previousData: ReviewData
): ReviewData => {
  let { interval, repetitions, easinessFactor } = previousData;

  if (quality >= 3) {
    // Resposta correta
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easinessFactor);
    }
    repetitions += 1;
  } else {
    // Resposta incorreta - resetar
    repetitions = 0;
    interval = 1;
  }

  // Ajustar fator de facilidade
  easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  if (easinessFactor < 1.3) {
    easinessFactor = 1.3;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    interval,
    repetitions,
    easinessFactor,
    nextReviewDate
  };
};

export const getInitialReviewData = (): ReviewData => ({
  interval: 1,
  repetitions: 0,
  easinessFactor: 2.5,
  nextReviewDate: new Date()
});

export const calculateQualityFromScore = (score: number, totalQuestions: number): number => {
  const percentage = (score / totalQuestions) * 100;
  
  if (percentage >= 90) return 5;
  if (percentage >= 80) return 4;
  if (percentage >= 70) return 3;
  if (percentage >= 60) return 2;
  if (percentage >= 50) return 1;
  return 0;
};