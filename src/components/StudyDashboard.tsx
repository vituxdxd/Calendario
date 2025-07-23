import { useState, useMemo } from 'react';
import { format, isToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Exercise } from '@/types/medical';
import { medicalSubjects, getSubjectById } from '@/utils/subjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/Calendar';
import { ExerciseCard } from '@/components/ExerciseCard';
import { GoogleCalendarIntegration } from '@/components/GoogleCalendarIntegration';
import { BarChart, TrendingUp, Clock, Target, BookOpen, CheckCircle2 } from 'lucide-react';

interface StudyDashboardProps {
  exercises: Exercise[];
  onExerciseStart: (exercise: Exercise) => void;
  onExerciseDelete: (exercise: Exercise) => void;
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

export function StudyDashboard({ exercises, onExerciseStart, onExerciseDelete, onDateSelect, selectedDate }: StudyDashboardProps) {
  const [activeTab, setActiveTab] = useState('today');

  const todayExercises = useMemo(() => {
    return exercises.filter(exercise => 
      isToday(new Date(exercise.nextReviewAt)) && !exercise.isSimulado
    );
  }, [exercises]);

  const todaySimulados = useMemo(() => {
    return exercises.filter(exercise => 
      isToday(new Date(exercise.nextReviewAt)) && exercise.isSimulado
    );
  }, [exercises]);

  const pendingExercises = useMemo(() => {
    const now = new Date();
    return exercises.filter(exercise => 
      new Date(exercise.nextReviewAt) <= now && !exercise.lastReviewedAt && !exercise.isSimulado
    );
  }, [exercises]);

  const selectedDateExercises = useMemo(() => {
    if (!selectedDate) return [];
    return exercises.filter(exercise => 
      isSameDay(new Date(exercise.nextReviewAt), selectedDate) && !exercise.isSimulado
    );
  }, [exercises, selectedDate]);

  const selectedDateSimulados = useMemo(() => {
    if (!selectedDate) return [];
    return exercises.filter(exercise => 
      isSameDay(new Date(exercise.nextReviewAt), selectedDate) && exercise.isSimulado
    );
  }, [exercises, selectedDate]);

  const stats = useMemo(() => {
    const total = exercises.length;
    const completed = exercises.filter(ex => ex.lastReviewedAt).length;
    const todayDue = todayExercises.length + todaySimulados.length;
    const avgSuccessRate = exercises.length > 0 
      ? exercises.reduce((sum, ex) => sum + ex.successRate, 0) / exercises.length 
      : 0;

    return { total, completed, todayDue, avgSuccessRate };
  }, [exercises, todayExercises, todaySimulados]);

  const subjectStats = useMemo(() => {
    return medicalSubjects.map(subject => {
      const subjectExercises = exercises.filter(ex => ex.subjectId === subject.id);
      const totalExercises = subjectExercises.length;
      const completedExercises = subjectExercises.filter(ex => ex.lastReviewedAt).length;
      const avgSuccessRate = totalExercises > 0
        ? subjectExercises.reduce((sum, ex) => sum + ex.successRate, 0) / totalExercises
        : 0;

      return {
        subject,
        totalExercises,
        completedExercises,
        avgSuccessRate,
        completionRate: totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0
      };
    }).filter(stat => stat.totalExercises > 0);
  }, [exercises]);


  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de Exercícios</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.todayDue}</p>
                <p className="text-sm text-muted-foreground">Para Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{Math.round(stats.avgSuccessRate)}%</p>
                <p className="text-sm text-muted-foreground">Taxa Média</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Calendar
            exercises={exercises}
            onDateSelect={onDateSelect}
            selectedDate={selectedDate}
          />
        </div>

        {/* Subject Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Progresso por Disciplina
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjectStats.map(({ subject, totalExercises, completedExercises, avgSuccessRate, completionRate }) => (
              <div key={subject.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{subject.icon}</span>
                    <span className="text-sm font-medium truncate">{subject.shortName}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {completedExercises}/{totalExercises}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Conclusão</span>
                    <span>{Math.round(completionRate)}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Taxa de acerto</span>
                  <span>{Math.round(avgSuccessRate)}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Google Calendar Integration */}
      <GoogleCalendarIntegration pendingExercises={pendingExercises} />

      {/* Exercises */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="today">
            Hoje ({todayExercises.length})
          </TabsTrigger>
          <TabsTrigger value="simulados">
            Simulados ({exercises.filter(ex => ex.isSimulado).length})
          </TabsTrigger>
          <TabsTrigger value="selected" disabled={!selectedDate}>
            {selectedDate ? format(selectedDate, 'dd/MM', { locale: ptBR }) : 'Data Selecionada'} 
            {selectedDate ? ` (${selectedDateExercises.length + selectedDateSimulados.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="all">
            Todos ({exercises.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Exercícios Regulares para Hoje</h3>
              {todayExercises.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-4xl mb-4">📚</div>
                    <h3 className="text-lg font-medium mb-2">Nenhum exercício regular para hoje!</h3>
                    <p className="text-muted-foreground">
                      Você está em dia com seus estudos regulares.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {todayExercises.map(exercise => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onStart={onExerciseStart}
                      onDelete={onExerciseDelete}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Simulados para Hoje</h3>
              {todaySimulados.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-4xl mb-4">🎯</div>
                    <h3 className="text-lg font-medium mb-2">Nenhum simulado para hoje!</h3>
                    <p className="text-muted-foreground">
                      Não há simulados programados para hoje.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {todaySimulados.map(exercise => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onStart={onExerciseStart}
                      onDelete={onExerciseDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="simulados" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Todos os Simulados</h3>
            {exercises.filter(ex => ex.isSimulado).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-lg font-medium mb-2">Nenhum simulado criado</h3>
                  <p className="text-muted-foreground">
                    Crie exercícios marcados como "Simulado" para vê-los aqui.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exercises.filter(ex => ex.isSimulado).map(exercise => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onStart={onExerciseStart}
                    onDelete={onExerciseDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="selected" className="mt-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Exercícios Regulares para {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''}
              </h3>
              {selectedDateExercises.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-4xl mb-4">📅</div>
                    <h3 className="text-lg font-medium mb-2">Nenhum exercício regular para esta data</h3>
                    <p className="text-muted-foreground">
                      Não há exercícios regulares programados para esta data.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedDateExercises.map(exercise => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onStart={onExerciseStart}
                      onDelete={onExerciseDelete}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Simulados para {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : ''}
              </h3>
              {selectedDateSimulados.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-4xl mb-4">🎯</div>
                    <h3 className="text-lg font-medium mb-2">Nenhum simulado para esta data</h3>
                    <p className="text-muted-foreground">
                      Não há simulados programados para esta data.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedDateSimulados.map(exercise => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onStart={onExerciseStart}
                      onDelete={onExerciseDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Todos os Exercícios</h3>
            {exercises.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="text-lg font-medium mb-2">Nenhum exercício cadastrado</h3>
                  <p className="text-muted-foreground">
                    Comece criando seu primeiro exercício de revisão espaçada.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exercises.map(exercise => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onStart={onExerciseStart}
                    onDelete={onExerciseDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}