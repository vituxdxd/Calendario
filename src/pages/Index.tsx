import { useState, useEffect } from 'react';
import { ReviewMistakes } from '@/components/ReviewMistakes';
import { MistakesPage } from '@/components/MistakesPage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Exercise, StudySession } from '@/types/medical';
import { useToast } from '@/hooks/use-toast';
import { getInitialReviewData, calculateQualityFromScore, calculateNextReview } from '@/utils/spacedRepetition';
import { AnswerLog } from '@/types/medical';
import { GraduationCap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StudyDashboard } from '@/components/StudyDashboard';
import { ExerciseForm } from '@/components/ExerciseForm';
import { QuizInterface } from '@/components/QuizInterface';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SchedulingOptions } from '@/components/SchedulingOptions';
import medicalHeroImage from '@/assets/medical-hero.jpg';

type ViewState = 'dashboard' | 'new-exercise' | 'quiz' | 'review' | 'mistakes';

const Index = () => {
  const [rawExercises, setRawExercises] = useLocalStorage<Exercise[]>('medical-exercises', []);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [studySessions, setStudySessions] = useLocalStorage<StudySession[]>('study-sessions', []);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [reviewExercise, setReviewExercise] = useState<Exercise | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [exerciseToReschedule, setExerciseToReschedule] = useState<Exercise | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const migrateExercises = (exercisesToMigrate: Exercise[]) => {
      const initialReviewData = getInitialReviewData();
      return exercisesToMigrate.map(ex => {
        if (ex.interval === undefined || ex.repetitions === undefined || ex.easinessFactor === undefined) {
          return {
            ...ex,
            interval: ex.interval ?? initialReviewData.interval,
            repetitions: ex.repetitions ?? initialReviewData.repetitions,
            easinessFactor: ex.easinessFactor ?? initialReviewData.easinessFactor,
          };
        }
        return ex;
      });
    };

    const migrated = migrateExercises(rawExercises);
    setExercises(migrated);
  }, [rawExercises]);

  const updateExercises = (updatedExercises: Exercise[]) => {
    setExercises(updatedExercises);
    setRawExercises(updatedExercises);
  };

  const handleSaveExercise = (exerciseData: Omit<Exercise, 'id' | 'createdAt' | 'lastReviewedAt' | 'nextReviewAt' | 'reviewCount' | 'successRate' | 'interval' | 'repetitions' | 'easinessFactor'>) => {
    const initialReviewData = getInitialReviewData();
    const newExercise: Exercise = {
      ...exerciseData,
      id: `ex_${Date.now()}`,
      createdAt: new Date(),
      nextReviewAt: new Date(),
      reviewCount: 0,
      successRate: 0,
      interval: initialReviewData.interval,
      repetitions: initialReviewData.repetitions,
      easinessFactor: initialReviewData.easinessFactor,
    };

    updateExercises([...exercises, newExercise]);
    setCurrentView('dashboard');
    
    toast({
      title: "Exercício criado!",
      description: `${newExercise.title} foi adicionado com sucesso.`,
    });
  };

  const handleStartExercise = (exercise: Exercise) => {
    setCurrentExercise(exercise);
    setCurrentView('quiz');
  };

  const handleCompleteQuiz = (score: number, timeSpent: number, answersLog: AnswerLog[]) => {
    if (!currentExercise) return;

    const session: StudySession = {
      id: `session_${Date.now()}`,
      exerciseId: currentExercise.id,
      completedAt: new Date(),
      score,
      timeSpent,
      answersLog
    };

    setStudySessions([...studySessions, session]);
    setIsScheduling(true);
  };

  const handleCancelQuiz = () => {
    setCurrentExercise(null);
    setCurrentView('dashboard');
  };

  const handleDeleteExercise = (exercise: Exercise) => {
    updateExercises(exercises.filter(ex => ex.id !== exercise.id));
    toast({
      title: "Exercício deletado",
      description: `${exercise.title} foi removido com sucesso.`,
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSaveReview = (originalExerciseId: string, updatedAnswers: AnswerLog[]) => {
    const exerciseToUpdate = exercises.find(ex => ex.id === originalExerciseId);
    if (!exerciseToUpdate) return;

    localStorage.setItem(`quiz-answers-${originalExerciseId}`, JSON.stringify(updatedAnswers));

    const correctAnswers = updatedAnswers.filter(a => a.isCorrect).length;
    const totalQuestions = exerciseToUpdate.questions.length;
    const newSuccessRate = (correctAnswers / totalQuestions) * 100;

    const quality = calculateQualityFromScore(correctAnswers, totalQuestions);
    const previousData = {
      interval: exerciseToUpdate.interval,
      repetitions: exerciseToUpdate.repetitions,
      easinessFactor: exerciseToUpdate.easinessFactor,
      nextReviewDate: exerciseToUpdate.nextReviewAt
    };
    const nextReview = calculateNextReview(quality, previousData);

    const updatedExercise: Exercise = {
      ...exerciseToUpdate,
      lastReviewedAt: new Date(),
      nextReviewAt: nextReview.nextReviewDate,
      reviewCount: exerciseToUpdate.reviewCount + 1,
      successRate: newSuccessRate,
      interval: nextReview.interval,
      repetitions: nextReview.repetitions,
      easinessFactor: nextReview.easinessFactor,
    };

    const updatedExercises = exercises.map(ex =>
      ex.id === originalExerciseId ? updatedExercise : ex
    );
    updateExercises(updatedExercises);

    const nextPendingExercise = updatedExercises
      .filter(ex => new Date(ex.nextReviewAt) > new Date())
      .sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime())[0];

    if (nextPendingExercise) {
      setSelectedDate(new Date(nextPendingExercise.nextReviewAt));
    }

    setReviewExercise(null);
    setCurrentView('dashboard');
    toast({
      title: "Revisão Concluída!",
      description: `${updatedExercise.title} foi atualizado. Próxima revisão em ${format(updatedExercise.nextReviewAt, 'PPP', { locale: ptBR })}.`,
    });
  };

  const handleReviewExercise = (exercise: Exercise) => {
    setReviewExercise(exercise);
    setCurrentView('review');
  };

  const handleChangeDate = (exercise: Exercise) => {
    setExerciseToReschedule(exercise);
    setIsScheduling(true);
  };

  const handleClearMistakes = (clearType: 'all' | 'subject' | 'question', targetId?: string) => {
    let updatedSessions = [...studySessions];

    switch (clearType) {
      case 'all':
        updatedSessions = [];
        break;
        
      case 'subject':
        if (targetId) {
          const exerciseIdsToRemove = exercises
            .filter(ex => ex.subjectId === targetId)
            .map(ex => ex.id);
          
          updatedSessions = studySessions.map(session => {
            if (exerciseIdsToRemove.includes(session.exerciseId)) {
              const filteredAnswersLog = session.answersLog.filter(answer => answer.isCorrect);
              return {
                ...session,
                answersLog: filteredAnswersLog
              };
            }
            return session;
          }).filter(session => session.answersLog.length > 0);
        }
        break;
        
      case 'question':
        if (targetId) {
          updatedSessions = studySessions.map(session => {
            const filteredAnswersLog = session.answersLog.filter(answer => 
              !(answer.questionId === targetId && !answer.isCorrect)
            );
            return {
              ...session,
              answersLog: filteredAnswersLog
            };
          }).filter(session => session.answersLog.length > 0);
        }
        break;
    }

    setStudySessions(updatedSessions);
  };

  const handleSchedule = (manualDate?: Date) => {
    const exerciseToUpdate = exerciseToReschedule || currentExercise;
    if (!exerciseToUpdate) return;

    let updatedExercise: Exercise;

    if (manualDate) {
      updatedExercise = {
        ...exerciseToUpdate,
        nextReviewAt: manualDate,
        lastReviewedAt: new Date(),
      };
    } else if (currentExercise) {
      const lastSession = studySessions.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()).find(s => s.exerciseId === currentExercise.id);
      if (!lastSession) return;

      const { score } = lastSession;
      const quality = calculateQualityFromScore(score, currentExercise.questions.length);
      
      const previousData = {
        interval: exerciseToUpdate.interval,
        repetitions: exerciseToUpdate.repetitions,
        easinessFactor: exerciseToUpdate.easinessFactor,
        nextReviewDate: exerciseToUpdate.nextReviewAt
      };

      const nextReview = calculateNextReview(quality, previousData);

      updatedExercise = {
        ...currentExercise,
        lastReviewedAt: new Date(),
        nextReviewAt: nextReview.nextReviewDate,
        reviewCount: currentExercise.reviewCount + 1,
        successRate: ((currentExercise.successRate * currentExercise.reviewCount) + (score / currentExercise.questions.length * 100)) / (currentExercise.reviewCount + 1),
        interval: nextReview.interval,
        repetitions: nextReview.repetitions,
        easinessFactor: nextReview.easinessFactor,
      };
    } else {
      return;
    }

    updateExercises(exercises.map(ex => ex.id === updatedExercise.id ? updatedExercise : ex));
    setCurrentExercise(null);
    setExerciseToReschedule(null);
    setIsScheduling(false);
    setCurrentView('dashboard');

    toast({
      title: "Revisão Agendada!",
      description: `Próxima revisão agendada para ${format(updatedExercise.nextReviewAt, 'PPP', { locale: ptBR })}.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Revisão Médica</h1>
                <p className="text-sm text-muted-foreground">Sistema de Estudos Espaçados</p>
              </div>
            </div>
            
            {currentView === 'dashboard' && (
              <div className="flex items-center gap-2">
                <Button onClick={() => setCurrentView('mistakes')} variant="outline">
                  Central de Erros
                </Button>
                <Button onClick={() => setCurrentView('new-exercise')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Exercício
                </Button>
                <ThemeToggle />
              </div>
            )}
            
            {currentView !== 'dashboard' && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setCurrentView('dashboard');
                  setCurrentExercise(null);
                  setReviewExercise(null);
                }}
              >
                Voltar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {currentView === 'dashboard' && (
          <>
            {(!exercises || exercises.length === 0) ? (
              <div className="text-center py-12">
                <Card className="max-w-2xl mx-auto">
                  <CardHeader>
                    <div className="w-full h-48 mb-6 rounded-lg overflow-hidden">
                      <img 
                        src={medicalHeroImage} 
                        alt="Medical study dashboard" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardTitle className="text-3xl mb-4">
                      Bem-vindo ao seu Sistema de Revisão Médica! 🩺
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-6">
                    <p className="text-lg text-muted-foreground">
                      Organize seus estudos médicos com um sistema inteligente de revisão espaçada.
                      Crie exercícios personalizados para suas disciplinas e acompanhe seu progresso.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📚</div>
                        <h3 className="font-semibold mb-1">Crie Exercícios</h3>
                        <p className="text-sm text-muted-foreground">
                          Adicione questões de múltipla escolha para suas disciplinas
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-4xl mb-2">🧠</div>
                        <h3 className="font-semibold mb-1">Revisão Inteligente</h3>
                        <p className="text-sm text-muted-foreground">
                          Sistema de repetição espaçada otimiza seu aprendizado
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-4xl mb-2">📈</div>
                        <h3 className="font-semibold mb-1">Acompanhe Progresso</h3>
                        <p className="text-sm text-muted-foreground">
                          Visualize suas estatísticas e evolução nos estudos
                        </p>
                      </div>
                    </div>

                    <Button 
                      size="lg" 
                      onClick={() => setCurrentView('new-exercise')}
                      className="text-lg px-8 py-6"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Criar Primeiro Exercício
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <StudyDashboard
                exercises={exercises || []}
                onExerciseStart={handleStartExercise}
                onExerciseDelete={handleDeleteExercise}
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                onReview={handleReviewExercise}
                onChangeDate={handleChangeDate}
              />
            )}
          </>
        )}

        {currentView === 'new-exercise' && (
          <ExerciseForm
            onSave={handleSaveExercise}
            onCancel={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'quiz' && currentExercise && (
          <QuizInterface
            exercise={currentExercise}
            onComplete={handleCompleteQuiz}
            onCancel={handleCancelQuiz}
          />
        )}

        {currentView === 'mistakes' && (
          <MistakesPage 
            exercises={exercises} 
            studySessions={studySessions}
            onClearMistakes={handleClearMistakes}
          />
        )}

        {currentView === 'review' && reviewExercise && (
          <ReviewMistakes
            exercise={reviewExercise}
            onClose={() => {
              setReviewExercise(null);
              setCurrentView('dashboard');
            }}
            onSaveReview={handleSaveReview}
          />
        )}
      </main>

      <Dialog open={isScheduling && (currentExercise !== null || exerciseToReschedule !== null)} onOpenChange={(open) => {
        setIsScheduling(open);
        if (!open) {
          setCurrentExercise(null);
          setExerciseToReschedule(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Próxima Revisão</DialogTitle>
          </DialogHeader>
          <SchedulingOptions onSchedule={handleSchedule} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;