import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { medicalSubjects } from '@/utils/subjects';
import { Exercise, Question } from '@/types/medical';
import { useToast } from '@/hooks/use-toast';

const exerciseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  subjectId: z.string().min(1, 'Disciplina é obrigatória'),
  link: z.string().url('Link deve ser uma URL válida'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

interface ExerciseFormProps {
  onSave: (exercise: Omit<Exercise, 'id' | 'createdAt' | 'lastReviewedAt' | 'nextReviewAt' | 'reviewCount' | 'successRate'>) => void;
  onCancel: () => void;
}

export function ExerciseForm({ onSave, onCancel }: ExerciseFormProps) {
  const [questions, setQuestions] = useState<Omit<Question, 'id'>[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof exerciseSchema>>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      title: '',
      description: '',
      subjectId: '',
      link: '',
      difficulty: 'medium',
    },
  });

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    (updatedQuestions[index] as any)[field] = value;
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const onSubmit = (values: z.infer<typeof exerciseSchema>) => {
    if (questions.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma questão",
        variant: "destructive"
      });
      return;
    }

    const questionsWithIds = questions.map((q, index) => ({
      ...q,
      id: `q_${Date.now()}_${index}`
    }));

    const exercise: Omit<Exercise, 'id' | 'createdAt' | 'lastReviewedAt' | 'nextReviewAt' | 'reviewCount' | 'successRate'> = {
      title: values.title,
      description: values.description || '',
      subjectId: values.subjectId,
      link: values.link,
      difficulty: values.difficulty,
      questions: questionsWithIds
    };

    onSave(exercise);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo Exercício</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do exercício" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição do exercício" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disciplina</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a disciplina" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {medicalSubjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              <div className="flex items-center gap-2">
                                <span>{subject.icon}</span>
                                <span>{subject.shortName}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dificuldade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a dificuldade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Fácil</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="hard">Difícil</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link do Material</FormLabel>
                    <FormControl>
                      <Input placeholder="https://exemplo.com/material" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Questões de Múltipla Escolha</CardTitle>
            <Button onClick={addQuestion} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Questão
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma questão adicionada. Clique em "Adicionar Questão" para começar.
            </p>
          ) : (
            <div className="space-y-6">
              {questions.map((question, questionIndex) => (
                <Card key={questionIndex} className="border-dashed">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Questão {questionIndex + 1}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(questionIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Pergunta</label>
                      <Textarea
                        placeholder="Digite a pergunta..."
                        value={question.question}
                        onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Alternativas</label>
                      <div className="space-y-2 mt-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <Badge variant={question.correctAnswer === optionIndex ? "default" : "outline"}>
                              {String.fromCharCode(65 + optionIndex)}
                            </Badge>
                            <Input
                              placeholder={`Alternativa ${String.fromCharCode(65 + optionIndex)}`}
                              value={option}
                              onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                            />
                            <Button
                              variant={question.correctAnswer === optionIndex ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex)}
                            >
                              Correta
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Explicação (opcional)</label>
                      <Textarea
                        placeholder="Explicação da resposta correta..."
                        value={question.explanation}
                        onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={form.handleSubmit(onSubmit)}>
          Salvar Exercício
        </Button>
      </div>
    </div>
  );
}