import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Exercise } from '@/types/medical';
import { getSubjectById } from '@/utils/subjects';

interface CalendarProps {
  exercises: Exercise[];
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

export function Calendar({ exercises, onDateSelect, selectedDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getExercisesForDate = (date: Date) => {
    return exercises.filter(exercise => 
      isSameDay(new Date(exercise.nextReviewAt), date)
    );
  };

  const getDayStatus = (date: Date) => {
    const dayExercises = getExercisesForDate(date);
    if (dayExercises.length === 0) return null;

    const completed = dayExercises.filter(ex => 
      ex.lastReviewedAt && isSameDay(new Date(ex.lastReviewedAt), date)
    ).length;

    if (completed === dayExercises.length) return 'completed';
    if (completed > 0) return 'partial';
    return 'pending';
  };

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const dayExercises = getExercisesForDate(day);
          const status = getDayStatus(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`
                relative p-2 min-h-[60px] rounded-lg border transition-all hover:bg-muted/50
                ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                ${isToday(day) ? 'ring-2 ring-primary ring-opacity-50' : ''}
                ${!isCurrentMonth ? 'opacity-50' : ''}
              `}
            >
              <div className="text-sm font-medium">
                {format(day, 'd')}
              </div>
              
              {dayExercises.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center justify-center">
                    {status === 'completed' && (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    )}
                    {status === 'partial' && (
                      <Clock className="h-3 w-3 text-yellow-600" />
                    )}
                    {status === 'pending' && (
                      <BookOpen className="h-3 w-3 text-blue-600" />
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    {dayExercises.length}
                  </Badge>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Concluído</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-600" />
          <span>Parcial</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-600" />
          <span>Pendente</span>
        </div>
      </div>
    </Card>
  );
}