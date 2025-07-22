import { useState } from 'react';
import { Exercise, StudySession, AnswerLog } from '@/types/medical';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { calculateNextReview, getInitialReviewData, calculateQualityFromScore } from '@/utils/spacedRepetition';
import { StudyDashboard } from '@/components/StudyDashboard';
import { ExerciseForm } from '@/components/ExerciseForm';
import { QuizInterface } from '@/components/QuizInterface';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, GraduationCap, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import heroImage from '@/assets/medical-hero.jpg';

type ViewState = 'dashboard' | 'new-exercise' | 'quiz';

const Index = () => {
  const [exercises, setExercises] = useLocalStorage<Exercise[]>('medical-exercises', []);
  const [studySessions, setStudySessions] = useLocalStorage<StudySession[]>('study-sessions', []);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const { toast } = useToast();

  const handleSaveExercise = (exerciseData: Omit<Exercise, 'id' | 'createdAt' | 'lastReviewedAt' | 'nextReviewAt' | 'reviewCount' | 'successRate'>) => {
    const newExercise: Exercise = {
      ...exerciseData,
      id: `ex_${Date.now()}`,
      createdAt: new Date(),
      nextReviewAt: new Date(),
      reviewCount: 0,
      successRate: 0
    };

    setExercises([...exercises, newExercise]);
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

    // Atualizar estatísticas do exercício
    const quality = calculateQualityFromScore(score, currentExercise.questions.length);
    const reviewData = getInitialReviewData();
    const nextReview = calculateNextReview(quality, reviewData);

    const updatedExercise: Exercise = {
      ...currentExercise,
      lastReviewedAt: new Date(),
      nextReviewAt: nextReview.nextReviewDate,
      reviewCount: currentExercise.reviewCount + 1,
      successRate: ((currentExercise.successRate * currentExercise.reviewCount) + (score / currentExercise.questions.length * 100)) / (currentExercise.reviewCount + 1)
    };

    setExercises(exercises.map(ex => ex.id === currentExercise.id ? updatedExercise : ex));
    setCurrentExercise(null);
    setCurrentView('dashboard');

    toast({
      title: "Quiz concluído!",
      description: `Próxima revisão em ${Math.ceil((nextReview.nextReviewDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias.`,
    });
  };

  const handleCancelQuiz = () => {
    setCurrentExercise(null);
    setCurrentView('dashboard');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              <Button onClick={() => setCurrentView('new-exercise')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Exercício
              </Button>
            )}
            
            {currentView !== 'dashboard' && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentView('dashboard')}
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
            {exercises.length === 0 ? (
              <div className="text-center py-12">
                <Card className="max-w-2xl mx-auto">
                  <CardHeader>
                    <div className="w-full h-48 mb-6 rounded-lg overflow-hidden">
                      <img 
                        src={heroImage} 
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
                exercises={exercises}
                onExerciseStart={handleStartExercise}
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
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
      </main>
    </div>
  );
};

export default Index;