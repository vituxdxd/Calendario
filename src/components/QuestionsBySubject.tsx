import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Search, Filter, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Exercise, Question } from '@/types/medical';
import { medicalSubjects, getSubjectById } from '@/utils/subjects';

interface QuestionsBySubjectProps {
  exercises: Exercise[];
  onBack: () => void;
}

interface QuestionWithContext extends Question {
  exerciseTitle: string;
  exerciseId: string;
  difficulty: string;
  subjectId: string;
}

export const QuestionsBySubject = ({ exercises, onBack }: QuestionsBySubjectProps) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [showAnswers, setShowAnswers] = useState<boolean>(false);

  // Preparar todas as questões com contexto
  const allQuestionsWithContext: QuestionWithContext[] = exercises.flatMap(exercise =>
    exercise.questions.map(question => ({
      ...question,
      exerciseTitle: exercise.title,
      exerciseId: exercise.id,
      difficulty: exercise.difficulty,
      subjectId: exercise.subjectId
    }))
  );

  // Filtrar questões
  const filteredQuestions = allQuestionsWithContext.filter(question => {
    const matchesSubject = selectedSubject === 'all' || question.subjectId === selectedSubject;
    const matchesDifficulty = difficultyFilter === 'all' || question.difficulty === difficultyFilter;
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.exerciseTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSubject && matchesDifficulty && matchesSearch;
  });

  // Estatísticas por disciplina
  const subjectStats = medicalSubjects.map(subject => {
    const subjectQuestions = allQuestionsWithContext.filter(q => q.subjectId === subject.id);
    return {
      ...subject,
      totalQuestions: subjectQuestions.length,
      totalExercises: exercises.filter(ex => ex.subjectId === subject.id).length
    };
  }).filter(stat => stat.totalQuestions > 0);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Médio';
      case 'hard': return 'Difícil';
      default: return difficulty;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Questões por Disciplina</h1>
            <p className="text-muted-foreground">
              Explore questões organizadas por matéria
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Questões</p>
                <p className="text-2xl font-bold">{allQuestionsWithContext.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Disciplinas</p>
                <p className="text-2xl font-bold">{subjectStats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Exercícios</p>
                <p className="text-2xl font-bold">{exercises.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Filtradas</p>
                <p className="text-2xl font-bold">{filteredQuestions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Disciplina</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as disciplinas</SelectItem>
                  {subjectStats.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.icon} {subject.shortName} ({subject.totalQuestions})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dificuldade</label>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as dificuldades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as dificuldades</SelectItem>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar questões..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Visualização</label>
              <Button
                variant={showAnswers ? "default" : "outline"}
                onClick={() => setShowAnswers(!showAnswers)}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showAnswers ? 'Ocultar' : 'Mostrar'} Respostas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de questões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Questões
            {selectedSubject !== 'all' && (
              <Badge variant="secondary">
                {getSubjectById(selectedSubject)?.shortName}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {filteredQuestions.length} questão(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Accordion type="single" collapsible className="space-y-4">
              {filteredQuestions.map((question, index) => {
                const subject = getSubjectById(question.subjectId);
                return (
                  <AccordionItem key={`${question.exerciseId}-${question.id}`} value={`question-${index}`}>
                    <Card>
                      <AccordionTrigger className="hover:no-underline">
                        <CardHeader className="w-full text-left">
                          <div className="flex items-start justify-between w-full">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {subject?.icon} {subject?.shortName}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs border ${getDifficultyColor(question.difficulty)}`}
                                >
                                  {getDifficultyText(question.difficulty)}
                                </Badge>
                              </div>
                              <CardTitle className="text-base font-medium">
                                {question.question}
                              </CardTitle>
                              <CardDescription className="text-sm mt-1">
                                De: {question.exerciseTitle}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                      </AccordionTrigger>
                      
                      <AccordionContent>
                        <CardContent className="pt-0">
                          <Separator className="mb-4" />
                          
                          {/* Opções */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Opções:</h4>
                            {question.options.map((option, optionIndex) => (
                              <div 
                                key={optionIndex}
                                className={`p-3 rounded-lg border ${
                                  showAnswers && optionIndex === question.correctAnswer
                                    ? 'bg-green-50 border-green-200 text-green-900'
                                    : 'bg-gray-50 border-gray-200 text-gray-900'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  {showAnswers && optionIndex === question.correctAnswer && (
                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  )}
                                  <span className="font-medium text-sm text-gray-700">
                                    {String.fromCharCode(65 + optionIndex)})
                                  </span>
                                  <span className="text-sm text-gray-800">{option}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Explicação */}
                          {showAnswers && question.explanation && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h4 className="font-medium text-sm text-blue-900 mb-2">
                                💡 Explicação:
                              </h4>
                              <p className="text-sm text-blue-800">{question.explanation}</p>
                            </div>
                          )}
                        </CardContent>
                      </AccordionContent>
                    </Card>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {filteredQuestions.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Nenhuma questão encontrada
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros ou criar novos exercícios
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
