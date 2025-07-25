import { useState, useMemo } from 'react';
import { Exercise } from '@/types/medical';
import { ExerciseCard } from './ExerciseCard';
import { Calendar } from './Calendar';
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
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
  onReview: (exercise: Exercise) => void;
  onChangeDate: (exercise: Exercise) => void;
}

export function StudyDashboard({ 
  exercises, 
  onExerciseStart, 
  onExerciseDelete, 
  onDateSelect, 
  selectedDate, 
  onReview, 
  onChangeDate 
}: StudyDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

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
    const avgSuccessRate = safeExercises.length > 0 
      ? Math.round(safeExercises.reduce((sum, ex) => sum + ex.successRate, 0) / safeExercises.length)
      : 0;

    return { totalExercises, dueToday, completed, avgSuccessRate };
  }, [safeExercises]);

  const categorizedExercises = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    
    return {
      overdue: safeExercises.filter(ex => isBefore(new Date(ex.nextReviewAt), today)) || [],
      dueToday: safeExercises.filter(ex => isToday(new Date(ex.nextReviewAt))) || [],
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
    <div className="space-y-8 fade-in">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Dashboard de Estudos
          </h1>
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
              className="hover-lift"
            >
              Limpar filtro
            </Button>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total de Exercícios",
            value: metrics.totalExercises,
            icon: BookOpen,
            gradient: "from-blue-500 to-cyan-500",
            bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20"
          },
          {
            title: "Pendentes Hoje",
            value: metrics.dueToday,
            icon: Target,
            gradient: "from-orange-500 to-red-500",
            bgGradient: "from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20",
            urgent: metrics.dueToday > 0
          },
          {
            title: "Concluídos",
            value: metrics.completed,
            icon: Star,
            gradient: "from-emerald-500 to-teal-500",
            bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20"
          },
          {
            title: "Taxa de Sucesso",
            value: `${metrics.avgSuccessRate}%`,
            icon: TrendingUp,
            gradient: "from-purple-500 to-indigo-500",
            bgGradient: "from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20"
          }
        ].map((metric, index) => (
          <Card key={index} className={`group hover-lift border-0 shadow-soft bg-gradient-to-br ${metric.bgGradient} backdrop-blur scale-in`} style={{animationDelay: `${index * 100}ms`}}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <p className={`text-2xl font-bold ${metric.urgent ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                    {metric.value}
                    {metric.urgent && (
                      <Zap className="inline h-5 w-5 ml-1 text-red-500 animate-pulse" />
                    )}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.gradient} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Exercises Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-soft bg-gradient-card backdrop-blur">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Seus Exercícios
                </CardTitle>
                <Badge variant="secondary" className="px-3 py-1">
                  {filteredExercises.length} exercícios
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/50">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm">
                    Todos ({categorizedExercises.all.length})
                  </TabsTrigger>
                  <TabsTrigger value="overdue" className="text-xs sm:text-sm">
                    Atrasados ({categorizedExercises.overdue.length})
                  </TabsTrigger>
                  <TabsTrigger value="today" className="text-xs sm:text-sm">
                    Hoje ({categorizedExercises.dueToday.length})
                  </TabsTrigger>
                  <TabsTrigger value="upcoming" className="text-xs sm:text-sm">
                    Próximos ({categorizedExercises.upcoming.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {selectedDate ? (
                    filteredExercises.length > 0 ? (
                      <div className="space-y-4">
                        {filteredExercises.map((exercise, index) => (
                          <div key={exercise.id} className="slide-up" style={{animationDelay: `${index * 100}ms`}}>
                            <ExerciseCard
                              exercise={exercise}
                              onStart={onExerciseStart}
                              onDelete={onExerciseDelete}
                              onReview={onReview}
                              onChangeDate={onChangeDate}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">
                          Nenhum exercício para esta data
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Selecione outra data no calendário
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      {safeExercises.map((exercise, index) => (
                        <div key={exercise.id} className="slide-up" style={{animationDelay: `${index * 50}ms`}}>
                          <ExerciseCard
                            exercise={exercise}
                            onStart={onExerciseStart}
                            onDelete={onExerciseDelete}
                            onReview={onReview}
                            onChangeDate={onChangeDate}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {['overdue', 'today', 'upcoming'].map(category => (
                  <TabsContent key={category} value={category} className="space-y-4">
                    {(categorizedExercises[category as keyof typeof categorizedExercises] || []).length > 0 ? (
                      <div className="space-y-4">
                        {(categorizedExercises[category as keyof typeof categorizedExercises] || []).map((exercise, index) => (
                          <div key={exercise.id} className="slide-up" style={{animationDelay: `${index * 100}ms`}}>
                            <ExerciseCard
                              exercise={exercise}
                              onStart={onExerciseStart}
                              onDelete={onExerciseDelete}
                              onReview={onReview}
                              onChangeDate={onChangeDate}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">
                          {category === 'overdue' && 'Nenhum exercício atrasado!'}
                          {category === 'today' && 'Nenhum exercício para hoje!'}
                          {category === 'upcoming' && 'Nenhum exercício próximo!'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Continue assim! 🎉
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
          <Card className="border-0 shadow-soft bg-gradient-card backdrop-blur scale-in">
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
          <Card className="border-0 shadow-soft bg-gradient-card backdrop-blur">
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
        </div>
      </div>
    </div>
  );
}