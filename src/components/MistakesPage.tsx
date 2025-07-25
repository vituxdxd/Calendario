import { useMemo, useState } from 'react';
import { Exercise, StudySession, Subject } from '@/types/medical';
import { medicalSubjects } from '@/utils/subjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Trash2, AlertTriangle, Eraser, TrendingDown, FileX, BarChart3, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';

interface MistakesPageProps {
  exercises: Exercise[];
  studySessions: StudySession[];
  onClearMistakes?: (clearType: 'all' | 'subject' | 'question', targetId?: string) => void;
}

interface Mistake {
  questionId: string;
  questionText: string;
  subject: Subject;
  exerciseTitle: string;
  mistakeCount: number;
}

export function MistakesPage({ exercises, studySessions, onClearMistakes }: MistakesPageProps) {
  const [filterSubject, setFilterSubject] = useState('all');
  const [sortBy, setSortBy] = useState('mistakeCount');
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const { toast } = useToast();

  const mistakes = useMemo<Mistake[]>(() => {
    const mistakeMap = new Map<string, Mistake>();

    if (!Array.isArray(studySessions)) {
      return [];
    }

    for (const session of studySessions) {
      if (!session || !Array.isArray(session.answersLog)) {
        continue;
      }

      const exercise = exercises.find(ex => ex.id === session.exerciseId);
      if (!exercise) continue;

      const subject = medicalSubjects.find(sub => sub.id === exercise.subjectId);
      if (!subject) continue;

      for (const answer of session.answersLog) {
        if (!answer.isCorrect) {
          const question = exercise.questions.find(q => q.id === answer.questionId);
          if (!question) continue;

          const existingMistake = mistakeMap.get(question.id);
          if (existingMistake) {
            mistakeMap.set(question.id, {
              ...existingMistake,
              mistakeCount: existingMistake.mistakeCount + 1,
            });
          } else {
            mistakeMap.set(question.id, {
              questionId: question.id,
              questionText: question.question,
              subject,
              exerciseTitle: exercise.title,
              mistakeCount: 1,
            });
          }
        }
      }
    }

    return Array.from(mistakeMap.values());
  }, [exercises, studySessions]);

  const filteredAndSortedMistakes = useMemo(() => {
    let result = [...mistakes];

    if (filterSubject !== 'all') {
      result = result.filter(m => m.subject.id === filterSubject);
    }

    result.sort((a, b) => {
      if (sortBy === 'mistakeCount') {
        return b.mistakeCount - a.mistakeCount;
      } else if (sortBy === 'subject') {
        return a.subject.name.localeCompare(b.subject.name);
      }
      return 0;
    });

    return result;
  }, [mistakes, filterSubject, sortBy]);

  const handleExport = () => {
    const csvData = filteredAndSortedMistakes.map(m => ({
      'Questão': m.questionText,
      'Disciplina': m.subject.name,
      'Exercício': m.exerciseTitle,
      'Contagem de Erros': m.mistakeCount,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'central_de_erros.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAllMistakes = () => {
    onClearMistakes?.('all');
    setIsManageDialogOpen(false);
    toast({
      title: "Histórico limpo!",
      description: "Todos os registros de erros foram removidos.",
    });
  };

  const handleClearSubjectMistakes = (subjectId: string) => {
    const subject = medicalSubjects.find(s => s.id === subjectId);
    onClearMistakes?.('subject', subjectId);
    setIsManageDialogOpen(false);
    toast({
      title: "Erros removidos!",
      description: `Erros da disciplina ${subject?.name} foram removidos.`,
    });
  };

  const handleClearQuestionMistake = (questionId: string) => {
    onClearMistakes?.('question', questionId);
    toast({
      title: "Erro removido!",
      description: `Registro de erro da questão removido.`,
    });
  };

  const getSubjectStats = () => {
    const stats = new Map<string, { name: string; count: number }>();
    
    mistakes.forEach(mistake => {
      const existing = stats.get(mistake.subject.id);
      if (existing) {
        stats.set(mistake.subject.id, {
          ...existing,
          count: existing.count + mistake.mistakeCount
        });
      } else {
        stats.set(mistake.subject.id, {
          name: mistake.subject.name,
          count: mistake.mistakeCount
        });
      }
    });

    return Array.from(stats.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      count: data.count
    }));
  };

  const totalMistakes = mistakes.reduce((sum, m) => sum + m.mistakeCount, 0);
  const uniqueMistakes = mistakes.length;

  return (
    <div className="space-y-8 fade-in">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Central de Erros
          </h1>
          <p className="text-muted-foreground">
            Analise e gerencie seus erros de estudo para melhorar o aprendizado
          </p>
        </div>
        
        <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="hover-lift shadow-soft bg-background/50 backdrop-blur border-border/60">
              <Eraser className="h-4 w-4 mr-2" />
              Gerenciar Erros
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl glass-card border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Gerenciar Registros de Erros</DialogTitle>
              <DialogDescription>
                Escolha como deseja limpar os registros de erros. Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Estatísticas */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-xl border border-blue-200/30 dark:border-blue-800/30">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  Resumo Atual
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{uniqueMistakes}</div>
                    <div className="text-sm text-muted-foreground">Erros únicos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{totalMistakes}</div>
                    <div className="text-sm text-muted-foreground">Total de ocorrências</div>
                  </div>
                </div>
              </div>

              {/* Opções de limpeza */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Opções de Limpeza
                  </h3>
                  
                  {/* Limpar por disciplina */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Por Disciplina</h4>
                    <div className="space-y-2">
                      {getSubjectStats().map(subject => (
                        <div key={subject.id} className="flex justify-between items-center p-3 rounded-lg bg-gradient-card border border-border/50 hover-lift">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                              {subject.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-medium">{subject.name}</span>
                              <Badge variant="secondary" className="ml-2 text-xs">{subject.count} erros</Badge>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="hover-lift">
                                <Trash2 className="h-3 w-3 mr-1" />
                                Limpar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="glass-card border-0 shadow-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar limpeza</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover todos os {subject.count} registros de erro da disciplina "{subject.name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleClearSubjectMistakes(subject.id)} className="btn-gradient">
                                  Confirmar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Limpar tudo */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border border-red-200/50 dark:border-red-800/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-red-800 dark:text-red-200">Limpeza Completa</h4>
                        <p className="text-sm text-red-600 dark:text-red-400">Remove todo o histórico de erros</p>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="shadow-soft hover:shadow-medium">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Limpar Tudo
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-card border-0 shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar limpeza completa</AlertDialogTitle>
                          <AlertDialogDescription>
                            <strong>Atenção:</strong> Esta ação irá remover permanentemente todos os {totalMistakes} registros de erro de todas as disciplinas. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearAllMistakes} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Confirmar Limpeza
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content Card */}
      <Card className="border-0 shadow-soft bg-gradient-card backdrop-blur">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              Análise de Erros
              <Badge variant="secondary" className="ml-2">
                {filteredAndSortedMistakes.length} questões
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-full sm:w-[200px] shadow-soft bg-background/50">
                  <SelectValue placeholder="Filtrar por disciplina" />
                </SelectTrigger>
                <SelectContent className="glass-card border-0 shadow-xl">
                  <SelectItem value="all">Todas as Disciplinas</SelectItem>
                  {medicalSubjects.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>
                      <div className="flex items-center gap-2">
                        <span>{sub.icon}</span>
                        <span>{sub.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px] shadow-soft bg-background/50">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="glass-card border-0 shadow-xl">
                  <SelectItem value="mistakeCount">Mais Frequentes</SelectItem>
                  <SelectItem value="subject">Disciplina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleExport} 
              variant="outline"
              disabled={filteredAndSortedMistakes.length === 0}
              className="hover-lift shadow-soft bg-background/50"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {/* Content */}
          {filteredAndSortedMistakes.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-xl mb-6">
                <FileX className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {filterSubject !== 'all' ? 'Nenhum erro encontrado nesta disciplina! 🎉' : 'Parabéns! 🎉'}
              </h3>
              <p className="text-muted-foreground">
                {filterSubject !== 'all' 
                  ? 'Tente selecionar outra disciplina ou "Todas as Disciplinas".' 
                  : 'Você não tem erros para revisar.'
                }
              </p>
            </div>
          ) : (
            <div className="border border-border/50 rounded-xl overflow-hidden bg-background/30">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/50">
                    <TableHead className="font-semibold">Questão</TableHead>
                    <TableHead className="font-semibold">Disciplina</TableHead>
                    <TableHead className="font-semibold">Exercício</TableHead>
                    <TableHead className="text-right font-semibold">Erros</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedMistakes.map((mistake, index) => (
                    <TableRow key={mistake.questionId} className="hover:bg-muted/30 transition-colors slide-up" style={{animationDelay: `${index * 50}ms`}}>
                      <TableCell className="font-medium max-w-md">
                        <div className="line-clamp-2 text-sm">
                          {mistake.questionText}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{mistake.subject.icon}</span>
                          <span className="font-medium text-sm">{mistake.subject.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {mistake.exerciseTitle}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive" className="text-sm font-semibold shadow-soft">
                          {mistake.mistakeCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover-glow">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass-card border-0 shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover registro de erro</AlertDialogTitle>
                              <AlertDialogDescription>
                                Deseja remover os {mistake.mistakeCount} registros de erro desta questão?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleClearQuestionMistake(mistake.questionId)} className="btn-gradient">
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
