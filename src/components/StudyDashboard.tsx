import { useState, useMemo } from 'react';
import { Exercise } from '@/types/medical';
import { ExerciseCard } from './ExerciseCard';
import { Calendar } from './Calendar';
import { GoogleCalendarIntegration, GoogleCalendarFunctions } from './GoogleCalendarIntegration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, BookOpen, TrendingUp, Clock, Star, BarChart3, Target, Zap } from 'lucide-react';
import { format, isToday, isBefore, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudyDashboardProps {
  exercises: Exercise[];
  onExerciseStart: (exercise: Exercise) => void;
  onExerciseDelete: (exercise: Exercise) => void;
  onExerciseEdit?: (exercise: Exercise) => void;
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
  onReview: (exercise: Exercise) => void;
  onChangeDate: (exercise: Exercise) => void;
  onViewBySubject?: () => void;
}

export function StudyDashboard({ 
  exercises, 
  onExerciseStart, 
  onExerciseDelete, 
  onExerciseEdit,
  onDateSelect, 
  selectedDate, 
  onReview, 
  onChangeDate,
  onViewBySubject 
}: StudyDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [googleCalendarFunctions, setGoogleCalendarFunctions] = useState<GoogleCalendarFunctions | null>(null);

  // Garantir que exercises sempre seja um array válido
  const safeExercises = exercises || [];

  // Calculations for metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    
    const totalExercises = safeExercises.length;
    const dueToday = safeExercises.filter(ex => 
      isToday(new Date(ex.nextReviewAt)) || isBefore(new Date(ex.nextReviewAt), today)
    ).length;
    const completed = safeExercises.filter(ex => ex.reviewCount > 0).length;
    
    // Calcular média apenas dos exercícios que foram completados
    const completedExercises = safeExercises.filter(ex => ex.reviewCount > 0);
    const avgSuccessRate = completedExercises.length > 0 
      ? Math.round(completedExercises.reduce((sum, ex) => sum + ex.successRate, 0) / completedExercises.length)
      : 0;

    return { totalExercises, dueToday, completed, avgSuccessRate };
  }, [safeExercises]);

  const categorizedExercises = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    
    return {
      overdue: safeExercises.filter(ex => isBefore(new Date(ex.nextReviewAt), today)) || [],
      dueToday: safeExercises.filter(ex => 
        isToday(new Date(ex.nextReviewAt)) || isBefore(new Date(ex.nextReviewAt), today)
      ) || [],
      upcoming: safeExercises.filter(ex => isAfter(new Date(ex.nextReviewAt), today)) || [],
      all: safeExercises || []
    };
  }, [safeExercises]);

  const filteredExercises = selectedDate 
    ? safeExercises.filter(ex => {
        const exerciseDate = startOfDay(new Date(ex.nextReviewAt));
        const filterDate = startOfDay(selectedDate);
        return exerciseDate.getTime() === filterDate.getTime();
      })
    : categorizedExercises.all;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Dashboard de Estudos</h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e mantenha-se organizado nos estudos
          </p>
        </div>
        
        {selectedDate && (
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-4 py-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4 mr-2" />
              {format(selectedDate, 'PPP', { locale: ptBR })}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDateSelect(new Date())}
            >
              Limpar filtro
            </Button>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total de Exercícios</p>
                <p className="text-2xl font-bold">{metrics.totalExercises}</p>
              </div>
              <BookOpen className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Para Revisar</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.dueToday}</p>
              </div>
              <Target className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold text-green-600">{metrics.completed}</p>
              </div>
              <Star className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.avgSuccessRate}%</p>
              </div>
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Exercises Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Seus Exercícios
                  </CardTitle>
                  {onViewBySubject && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={onViewBySubject}
                      className="text-xs"
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      Ver por Disciplina
                    </Button>
                  )}
                </div>
                <Badge variant="secondary" className="px-3 py-1">
                  {filteredExercises.length} exercícios
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="overview">
                    Todos ({categorizedExercises.all.length})
                  </TabsTrigger>
                  <TabsTrigger value="today">
                    Para Revisar ({categorizedExercises.dueToday.length})
                  </TabsTrigger>
                  <TabsTrigger value="upcoming">
                    Próximos ({categorizedExercises.upcoming.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {selectedDate ? (
                    filteredExercises.length > 0 ? (
                      <div className="space-y-4">
                        {filteredExercises.map((exercise) => (
                          <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            onStart={onExerciseStart}
                            onDelete={onExerciseDelete}
                            onEdit={onExerciseEdit}
                            onReview={onReview}
                            onChangeDate={onChangeDate}
                            googleCalendarFunctions={googleCalendarFunctions}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">
                          Nenhum exercício para esta data
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      {safeExercises.map((exercise) => (
                        <ExerciseCard
                          key={exercise.id}
                          exercise={exercise}
                          onStart={onExerciseStart}
                          onDelete={onExerciseDelete}
                          onEdit={onExerciseEdit}
                          onReview={onReview}
                          onChangeDate={onChangeDate}
                          googleCalendarFunctions={googleCalendarFunctions}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {['today', 'upcoming'].map(category => (
                  <TabsContent key={category} value={category} className="space-y-4">
                    {(categorizedExercises[category as keyof typeof categorizedExercises] || []).length > 0 ? (
                      <div className="space-y-4">
                        {(categorizedExercises[category as keyof typeof categorizedExercises] || []).map((exercise) => (
                          <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            onStart={onExerciseStart}
                            onDelete={onExerciseDelete}
                            onEdit={onExerciseEdit}
                            onReview={onReview}
                            onChangeDate={onChangeDate}
                            googleCalendarFunctions={googleCalendarFunctions}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">
                          {category === 'today' && 'Nenhum exercício para revisar!'}
                          {category === 'upcoming' && 'Nenhum exercício próximo!'}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Calendário de Estudos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                exercises={safeExercises}
                onDateSelect={onDateSelect}
                selectedDate={selectedDate}
              />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Estatísticas Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Exercícios criados</span>
                  <Badge variant="secondary">{safeExercises.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Revisões realizadas</span>
                  <Badge variant="secondary">
                    {safeExercises.reduce((sum, ex) => sum + ex.reviewCount, 0)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Taxa média</span>
                  <Badge variant={metrics.avgSuccessRate >= 70 ? "default" : "destructive"}>
                    {metrics.avgSuccessRate}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Calendar Integration */}
          <GoogleCalendarIntegration 
            exercises={safeExercises}
            onSyncUpdate={() => {
              // Callback quando a sincronização for concluída
            }}
            onFunctionsReady={(functions) => {
              setGoogleCalendarFunctions(functions);
            }}
          />
        </div>
      </div>
    </div>
  );
}