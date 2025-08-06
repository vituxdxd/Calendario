import { format, isToday, isBefore, isAfter, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Exercise } from '@/types/medical';
import { GoogleCalendarFunctions } from './GoogleCalendarIntegration';
import { getSubjectById } from '@/utils/subjects';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Play, 
  MoreVertical, 
  Trash2, 
  Calendar, 
  BookOpen,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Star,
  Edit,
  RotateCcw,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ExerciseCardProps {
  exercise: Exercise;
  onStart: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
  onEdit?: (exercise: Exercise) => void;
  onReview?: (exercise: Exercise) => void;
  onChangeDate: (exercise: Exercise) => void;
  googleCalendarFunctions?: GoogleCalendarFunctions | null;
}

export function ExerciseCard({ exercise, onStart, onDelete, onEdit, onReview, onChangeDate, googleCalendarFunctions }: ExerciseCardProps) {
  const [isGoogleSyncing, setIsGoogleSyncing] = useState(false);
  const subject = getSubjectById(exercise.subjectId);
  const nextReviewDate = new Date(exercise.nextReviewAt);
  const now = new Date();
  
  // Determine status
  const isOverdue = isBefore(nextReviewDate, now) && !isToday(nextReviewDate);
  const isDueToday = isToday(nextReviewDate);
  const isUpcoming = isAfter(nextReviewDate, now);
  
  // Status configuration
  const getStatusConfig = () => {
    if (isOverdue) {
      return {
        status: 'Atrasado',
        variant: 'destructive' as const,
        icon: AlertCircle,
        bgGradient: 'from-red-50 to-pink-50 dark:from-red-950/10 dark:to-pink-950/10',
        borderClass: 'border-red-200 dark:border-red-800/30'
      };
    }
    if (isDueToday) {
      return {
        status: 'Devido Hoje',
        variant: 'default' as const,
        icon: Target,
        bgGradient: 'from-orange-50 to-yellow-50 dark:from-orange-950/10 dark:to-yellow-950/10',
        borderClass: 'border-orange-200 dark:border-orange-800/30'
      };
    }
    return {
      status: 'Agendado',
      variant: 'secondary' as const,
      icon: CheckCircle,
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/10 dark:to-teal-950/10',
      borderClass: 'border-emerald-200 dark:border-emerald-800/30'
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Difficulty configuration
  const getDifficultyConfig = () => {
    switch (exercise.difficulty) {
      case 'easy':
        return { label: 'Fácil', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/20' };
      case 'medium':
        return { label: 'Médio', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' };
      case 'hard':
        return { label: 'Difícil', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/20' };
    }
  };

  const difficultyConfig = getDifficultyConfig();

  return (
    <Card className={`group hover-lift transition-all duration-300 border-0 shadow-soft bg-gradient-to-br ${statusConfig.bgGradient} backdrop-blur hover:shadow-medium ${statusConfig.borderClass} border`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Subject Icon */}
            <div className="flex-shrink-0">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg group-hover:shadow-xl transition-all duration-300"
                style={{ backgroundColor: subject?.color || '#6366f1' }}
              >
                {subject?.icon || '📚'}
              </div>
            </div>

            {/* Exercise Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                  {exercise.title}
                </h3>
                {exercise.isSimulado && (
                  <Badge variant="outline" className="text-xs font-medium bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
                    <Star className="w-3 h-3 mr-1" />
                    Simulado
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {exercise.description}
              </p>

              {/* Metadata Row */}
              <div className="flex items-center flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <BookOpen className="w-3 h-3" />
                  <span>{exercise.questions.length} questões</span>
                </div>
                
                <Badge 
                  variant="secondary" 
                  className={`${difficultyConfig.bgColor} ${difficultyConfig.color} text-xs font-medium border-0`}
                >
                  {difficultyConfig.label}
                </Badge>

                <div className="flex items-center gap-1 text-muted-foreground">
                  <RotateCcw className="w-3 h-3" />
                  <span>{exercise.reviewCount} revisões</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover-glow"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onEdit && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(exercise)} className="text-green-600">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Exercício
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {onReview && exercise.reviewCount > 0 && (
                <>
                  <DropdownMenuItem onClick={() => onReview(exercise)} className="text-blue-600">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Revisar Erros
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => onChangeDate(exercise)}>
                <Calendar className="mr-2 h-4 w-4" />
                Reagendar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(exercise)} 
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Progress Section */}
        {exercise.reviewCount > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</span>
              <span className="text-sm font-bold text-foreground">{Math.round(exercise.successRate)}%</span>
            </div>
            <Progress 
              value={exercise.successRate} 
              className="h-2"
            />
          </div>
        )}

        {/* Status and Date Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <StatusIcon className={`w-4 h-4 ${isOverdue ? 'text-red-500' : isDueToday ? 'text-orange-500' : 'text-emerald-500'}`} />
            <Badge variant={statusConfig.variant} className="text-xs font-medium">
              {statusConfig.status}
            </Badge>
          </div>

          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{format(nextReviewDate, 'dd/MM/yy', { locale: ptBR })}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => onStart(exercise)}
            className="flex-1 btn-gradient shadow-soft hover:shadow-medium transition-all duration-300"
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            {exercise.reviewCount > 0 ? 'Revisar' : 'Iniciar'}
          </Button>

          {exercise.reviewCount > 0 && (
            <div className="flex items-center gap-1 px-3 py-2 rounded-md bg-muted/50 border border-border/50">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {Math.round(exercise.successRate)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}