import { Exercise } from '@/types/medical';
import { getSubjectById } from '@/utils/subjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, ExternalLink, BarChart3, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExerciseCardProps {
  exercise: Exercise;
  onStart: (exercise: Exercise) => void;
}

export function ExerciseCard({ exercise, onStart }: ExerciseCardProps) {
  const subject = getSubjectById(exercise.subjectId);
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Médio';
      case 'hard': return 'Difícil';
      default: return 'Desconhecido';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{subject?.icon}</span>
              <Badge variant="outline" className="text-xs">
                {subject?.shortName}
              </Badge>
              <Badge className={getDifficultyColor(exercise.difficulty)}>
                {getDifficultyLabel(exercise.difficulty)}
              </Badge>
            </div>
            <CardTitle className="text-lg line-clamp-2">
              {exercise.title}
            </CardTitle>
          </div>
        </div>
        
        {exercise.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {exercise.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{exercise.questions.length} questões</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span>{Math.round(exercise.successRate)}% acerto</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Taxa de Sucesso</span>
              <span>{Math.round(exercise.successRate)}%</span>
            </div>
            <Progress value={exercise.successRate} className="h-2" />
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Próxima revisão: {format(new Date(exercise.nextReviewAt), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => onStart(exercise)} className="w-full">
              Iniciar Exercício
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}