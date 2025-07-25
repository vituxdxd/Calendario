import { useState, useEffect } from 'react';
import { Exercise, AnswerLog } from '@/types/medical';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuizInterface } from './QuizInterface';

interface ReviewMistakesProps {
  exercise: Exercise;
  onClose: () => void;
  onSaveReview: (originalExerciseId: string, updatedAnswers: AnswerLog[]) => void;
}

export function ReviewMistakes({ exercise, onClose, onSaveReview }: ReviewMistakesProps) {
  const [answersLog, setAnswersLog] = useState<AnswerLog[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isRedoingAll, setIsRedoingAll] = useState(false);

  const loadAnswers = () => {
    const savedAnswers = localStorage.getItem(`quiz-answers-${exercise.id}`);
    if (savedAnswers) {
      setAnswersLog(JSON.parse(savedAnswers));
    } else {
      setAnswersLog([]);
    }
  };

  useEffect(() => {
    loadAnswers();
  }, [exercise.id]);

  const wrongQuestions = exercise.questions.filter((question) => {
    const log = answersLog.find((log) => log.questionId === question.id);
    return log && !log.isCorrect;
  });

  const reviewExercise: Exercise = {
    ...exercise,
    id: `review-${exercise.id}`,
    title: `Revisão - ${exercise.title}`,
    description: 'Revisão das questões que você errou',
    questions: wrongQuestions,
  };

  const redoAllExercise: Exercise = {
    ...exercise,
    title: `Refazendo - ${exercise.title}`,
  };

  const handleReviewComplete = (
    score: number,
    timeSpent: number,
    reviewAnswersLog: AnswerLog[]
  ) => {
    // Carrega o log de respostas original
    const originalAnswers = [...answersLog];

    // Atualiza o log original com as respostas da revisão
    reviewAnswersLog.forEach(reviewAnswer => {
      const originalAnswerIndex = originalAnswers.findIndex(
        log => log.questionId === reviewAnswer.questionId
      );
      if (originalAnswerIndex !== -1) {
        originalAnswers[originalAnswerIndex] = { ...originalAnswers[originalAnswerIndex], ...reviewAnswer };
      }
    });

    // Salva o log atualizado e fecha a tela de revisão
    onSaveReview(exercise.id, originalAnswers);
    setIsReviewing(false);
  };

  if (isRedoingAll) {
    return (
      <QuizInterface
        exercise={redoAllExercise}
        onComplete={(score, timeSpent, answersLog) => {
          onSaveReview(exercise.id, answersLog);
          setIsRedoingAll(false);
        }}
        onCancel={() => setIsRedoingAll(false)}
      />
    );
  }

  if (isReviewing) {
    return (
      <QuizInterface
        exercise={reviewExercise}
        onComplete={handleReviewComplete}
        onCancel={() => setIsReviewing(false)}
      />
    );
  }

  if (wrongQuestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl">Parabéns! 🎉</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            Você não tem questões erradas para revisar neste exercício.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={onClose}>
              Voltar
            </Button>
            <Button onClick={() => setIsRedoingAll(true)}>Refazer Todas</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl">Revisão de Questões</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-6">
        <div>
          <p className="text-lg mb-2">
            Você tem {wrongQuestions.length} questões para revisar
          </p>
          <p className="text-muted-foreground">
            Revise as questões que você errou para melhorar seu aprendizado
          </p>
        </div>

        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={onClose}>
            Voltar
          </Button>
          <Button onClick={() => setIsReviewing(true)}>
            Iniciar Revisão
          </Button>
          <Button variant="secondary" onClick={() => setIsRedoingAll(true)}>
            Refazer Todas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 