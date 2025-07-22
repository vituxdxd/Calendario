import { useState, useEffect } from 'react';
import { Exercise, Question, AnswerLog } from '@/types/medical';
import { getSubjectById } from '@/utils/subjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, ArrowRight, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuizInterfaceProps {
  exercise: Exercise;
  onComplete: (score: number, timeSpent: number, answersLog: AnswerLog[]) => void;
  onCancel: () => void;
}

export function QuizInterface({ exercise, onComplete, onCancel }: QuizInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [answersLog, setAnswersLog] = useState<AnswerLog[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const { toast } = useToast();

  const subject = getSubjectById(exercise.subjectId);
  const currentQuestion = exercise.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exercise.questions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newSelectedAnswers);
  };

  const handleNextQuestion = () => {
    const timeSpent = Date.now() - questionStartTime;
    const isCorrect = selectedAnswers[currentQuestionIndex] === currentQuestion.correctAnswer;
    
    const answerLog: AnswerLog = {
      questionId: currentQuestion.id,
      selectedAnswer: selectedAnswers[currentQuestionIndex],
      isCorrect,
      timeSpent
    };

    setAnswersLog([...answersLog, answerLog]);

    if (currentQuestionIndex < exercise.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
      setShowResult(false);
    } else {
      completeQuiz([...answersLog, answerLog]);
    }
  };

  const completeQuiz = (finalAnswersLog: AnswerLog[]) => {
    const correctAnswers = finalAnswersLog.filter(log => log.isCorrect).length;
    const totalTime = Date.now() - startTime;
    
    setIsCompleted(true);
    onComplete(correctAnswers, totalTime, finalAnswersLog);
    
    toast({
      title: "Quiz Concluído!",
      description: `Você acertou ${correctAnswers} de ${exercise.questions.length} questões.`,
    });
  };

  const handleShowResult = () => {
    if (selectedAnswers[currentQuestionIndex] === undefined) {
      toast({
        title: "Selecione uma resposta",
        description: "Por favor, selecione uma alternativa antes de continuar.",
        variant: "destructive"
      });
      return;
    }
    setShowResult(true);
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResult(false);
    setAnswersLog([]);
    setIsCompleted(false);
    setQuestionStartTime(Date.now());
  };

  if (!currentQuestion) return null;

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
              <Badge variant="outline">
                {currentQuestionIndex + 1} / {exercise.questions.length}
              </Badge>
              {!isCompleted && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-6" />
        </CardContent>
      </Card>

      {!isCompleted ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Questão {currentQuestionIndex + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-base leading-relaxed">
              {currentQuestion.question}
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === index;
                const isCorrect = index === currentQuestion.correctAnswer;
                const showCorrectAnswer = showResult && isCorrect;
                const showWrongAnswer = showResult && isSelected && !isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showResult}
                    className={`
                      w-full p-4 text-left rounded-lg border transition-all
                      ${isSelected && !showResult ? 'border-primary bg-primary/5' : 'border-border'}
                      ${showCorrectAnswer ? 'border-green-500 bg-green-50' : ''}
                      ${showWrongAnswer ? 'border-red-500 bg-red-50' : ''}
                      ${!showResult ? 'hover:bg-muted/50' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={isSelected && !showResult ? "default" : "outline"}>
                        {String.fromCharCode(65 + index)}
                      </Badge>
                      <span className="flex-1">{option}</span>
                      {showCorrectAnswer && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {showWrongAnswer && <XCircle className="h-5 w-5 text-red-600" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {showResult && currentQuestion.explanation && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <div className="text-blue-600 mt-1">💡</div>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Explicação</h4>
                      <p className="text-blue-800 text-sm">{currentQuestion.explanation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Questão {currentQuestionIndex + 1} de {exercise.questions.length}</span>
              </div>
              
              <div className="flex gap-2">
                {!showResult ? (
                  <Button onClick={handleShowResult}>
                    Ver Resultado
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion}>
                    {currentQuestionIndex < exercise.questions.length - 1 ? (
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
                  {answersLog.filter(log => log.isCorrect).length}
                </div>
                <div className="text-sm text-muted-foreground">Corretas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {answersLog.filter(log => !log.isCorrect).length}
                </div>
                <div className="text-sm text-muted-foreground">Incorretas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((answersLog.filter(log => log.isCorrect).length / exercise.questions.length) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Acerto</div>
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <Button onClick={restartQuiz} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Refazer
              </Button>
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