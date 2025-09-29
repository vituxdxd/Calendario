import { useState, useEffect, useMemo } from 'react';
import { Exercise, Question, AnswerLog } from '@/types/medical';
import { getSubjectById } from '@/utils/subjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, ArrowRight, RotateCcw, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ReviewMistakes } from './ReviewMistakes';

interface QuizInterfaceProps {
  exercise: Exercise;
  onComplete: (score: number, timeSpent: number, answersLog: AnswerLog[]) => void;
  onCancel: () => void;
}

interface QuizState {
  currentQuestionIndex: number;
  selectedAnswers: number[];
  showResult: boolean;
  startTime: number;
  questionStartTime: number;
  answersLog: AnswerLog[];
  isCompleted: boolean;
}

export function QuizInterface({ exercise, onComplete, onCancel }: QuizInterfaceProps) {
  const [quizState, setQuizState] = useLocalStorage<QuizState>(`quiz-state-${exercise.id}`, {
    currentQuestionIndex: 0,
    selectedAnswers: [],
    showResult: false,
    startTime: Date.now(),
    questionStartTime: Date.now(),
    answersLog: [],
    isCompleted: false
  });

  const [showReview, setShowReview] = useState(false);
  const { toast } = useToast();
  const subject = getSubjectById(exercise.subjectId);
  const currentQuestion = exercise.questions[quizState.currentQuestionIndex];
  const progress = ((quizState.currentQuestionIndex + 1) / exercise.questions.length) * 100;

  const shuffledOptions = useMemo(() => {
    if (!currentQuestion) return [];
    
    const options = currentQuestion.options.map((option, index) => ({
      text: option,
      originalIndex: index
    }));
    
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    
    return options;
  }, [currentQuestion, quizState.currentQuestionIndex]);

  const getOriginalIndex = (shuffledIndex: number) => {
    return shuffledOptions[shuffledIndex]?.originalIndex ?? 0;
  };

  const handleAnswerSelect = (shuffledIndex: number) => {
    if (quizState.showResult) return;
    
    const originalIndex = getOriginalIndex(shuffledIndex);
    const newSelectedAnswers = [...quizState.selectedAnswers];
    newSelectedAnswers[quizState.currentQuestionIndex] = originalIndex;
    
    setQuizState({
      ...quizState,
      selectedAnswers: newSelectedAnswers
    });
  };

  const handleNextQuestion = () => {
    const timeSpent = Date.now() - quizState.questionStartTime;
    const isCorrect = quizState.selectedAnswers[quizState.currentQuestionIndex] === currentQuestion.correctAnswer;
    
    const answerLog: AnswerLog = {
      questionId: currentQuestion.id,
      selectedAnswer: quizState.selectedAnswers[quizState.currentQuestionIndex],
      isCorrect,
      timeSpent
    };

    const newAnswersLog = [...quizState.answersLog, answerLog];

    if (quizState.currentQuestionIndex < exercise.questions.length - 1) {
      setQuizState({
        ...quizState,
        currentQuestionIndex: quizState.currentQuestionIndex + 1,
        questionStartTime: Date.now(),
        showResult: false,
        answersLog: newAnswersLog
      });
    } else {
      completeQuiz(newAnswersLog);
    }
  };

  const completeQuiz = (finalAnswersLog: AnswerLog[]) => {
    const correctAnswers = finalAnswersLog.filter(log => log.isCorrect).length;
    const totalTime = Date.now() - quizState.startTime;
    
    localStorage.setItem(`quiz-answers-${exercise.id}`, JSON.stringify(finalAnswersLog));
    
    setQuizState({
      ...quizState,
      isCompleted: true,
      answersLog: finalAnswersLog
    });
    
    onComplete(correctAnswers, totalTime, finalAnswersLog);
  };

  const handleShowResult = () => {
    if (quizState.selectedAnswers[quizState.currentQuestionIndex] === undefined) {
      toast({
        title: "Selecione uma resposta",
        description: "Por favor, selecione uma alternativa antes de continuar.",
        variant: "destructive"
      });
      return;
    }
    setQuizState({
      ...quizState,
      showResult: true
    });
  };

  const restartQuiz = () => {
    setQuizState({
      currentQuestionIndex: 0,
      selectedAnswers: [],
      showResult: false,
      startTime: Date.now(),
      questionStartTime: Date.now(),
      answersLog: [],
      isCompleted: false
    });
  };

  if (showReview) {
    return (
      <ReviewMistakes
        exercise={exercise}
        onClose={() => setShowReview(false)}
        onSaveReview={() => {}}
      />
    );
  }

  if (!currentQuestion && !quizState.isCompleted) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{subject?.icon}</span>
              <div>
                <CardTitle className="text-xl">{exercise.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {subject?.shortName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!quizState.isCompleted && (
                <>
                  <Badge variant="outline">
                    {quizState.currentQuestionIndex + 1} / {exercise.questions.length}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={onCancel}>
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        {!quizState.isCompleted && (
          <CardContent>
            <Progress value={progress} className="mb-6" />
          </CardContent>
        )}
      </Card>

      {!quizState.isCompleted ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Questão {quizState.currentQuestionIndex + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-base leading-relaxed">
              {currentQuestion.question}
            </div>

            <div className="space-y-3">
              {shuffledOptions.map((option, shuffledIndex) => {
                const originalIndex = option.originalIndex;
                const isSelected = quizState.selectedAnswers[quizState.currentQuestionIndex] === originalIndex;
                const isCorrect = originalIndex === currentQuestion.correctAnswer;
                const showCorrectAnswer = quizState.showResult && isCorrect;
                const showWrongAnswer = quizState.showResult && isSelected && !isCorrect;

                return (
                  <button
                    key={shuffledIndex}
                    onClick={() => handleAnswerSelect(shuffledIndex)}
                    disabled={quizState.showResult}
                    className={`
                      w-full p-4 text-left rounded-lg border transition-all
                      ${isSelected && !quizState.showResult ? 'border-primary bg-primary/5' : 'border-border'}
                      ${showCorrectAnswer ? 'border-green-500 bg-green-50 dark:bg-green-900 dark:text-green-200' : ''}
                      ${showWrongAnswer ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:text-red-200' : ''}
                      ${!quizState.showResult ? 'hover:bg-muted/50' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={isSelected && !quizState.showResult ? "default" : "outline"}>
                        {String.fromCharCode(65 + shuffledIndex)}
                      </Badge>
                      <span className="flex-1">{option.text}</span>
                      {showCorrectAnswer && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {showWrongAnswer && <XCircle className="h-5 w-5 text-red-600" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {quizState.showResult && currentQuestion.explanation && (
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <div className="text-blue-600 dark:text-blue-400 mt-1">💡</div>
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-1">Explicação</h4>
                      <p className="text-blue-800 dark:text-blue-300 text-sm">{currentQuestion.explanation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Questão {quizState.currentQuestionIndex + 1} de {exercise.questions.length}</span>
              </div>
              
              <div className="flex gap-2">
                {!quizState.showResult ? (
                  <Button onClick={handleShowResult}>
                    Ver Resultado
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion}>
                    {quizState.currentQuestionIndex < exercise.questions.length - 1 ? (
                      <>
                        Próxima <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      'Finalizar Quiz'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">Quiz Concluído!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {quizState.answersLog.filter(log => log.isCorrect).length}
                </div>
                <div className="text-sm text-muted-foreground">Corretas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {quizState.answersLog.filter(log => !log.isCorrect).length}
                </div>
                <div className="text-sm text-muted-foreground">Incorretas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((quizState.answersLog.filter(log => log.isCorrect).length / exercise.questions.length) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Acerto</div>
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <Button onClick={restartQuiz} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Refazer
              </Button>
              {quizState.answersLog.some(log => !log.isCorrect) && (
                <Button onClick={() => setShowReview(true)} variant="secondary">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Revisar Erros
                </Button>
              )}
              <Button onClick={onCancel}>
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
