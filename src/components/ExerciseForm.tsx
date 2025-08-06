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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Upload, FileText, Clipboard, Code } from 'lucide-react';
import { medicalSubjects } from '@/utils/subjects';
import { Exercise, Question } from '@/types/medical';
import { useToast } from '@/hooks/use-toast';

const exerciseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  subjectId: z.string().min(1, 'Disciplina é obrigatória'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  isSimulado: z.boolean().default(false),
  isTBL: z.boolean().default(false),
});

interface ExerciseFormProps {
  exercise?: Exercise; // Para edição
  onSave: (exercise: Omit<Exercise, 'id' | 'createdAt' | 'lastReviewedAt' | 'nextReviewAt' | 'reviewCount' | 'successRate' | 'interval' | 'repetitions' | 'easinessFactor'>) => void;
  onCancel: () => void;
}

interface ImportedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export function ExerciseForm({ exercise, onSave, onCancel }: ExerciseFormProps) {
  const [questions, setQuestions] = useState<Omit<Question, 'id'>[]>(
    exercise?.questions || []
  );
  const [jsonInput, setJsonInput] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof exerciseSchema>>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      title: exercise?.title || '',
      description: exercise?.description || '',
      subjectId: exercise?.subjectId || '',
      difficulty: exercise?.difficulty || 'medium',
      isSimulado: exercise?.isSimulado || false,
      isTBL: false,
    },
  });

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        processJsonImport(content);
      } catch (error) {
        toast({
          title: "Erro na importação",
          description: error instanceof Error ? error.message : "Erro ao ler o arquivo",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const handleJsonPaste = () => {
    if (!jsonInput.trim()) {
      toast({
        title: "Erro",
        description: "Cole o código JSON no campo de texto",
        variant: "destructive"
      });
      return;
    }

    try {
      processJsonImport(jsonInput);
      setJsonInput('');
      setIsImportDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Formato JSON inválido",
        variant: "destructive"
      });
    }
  };

  const processJsonImport = (content: string) => {
    const imported = JSON.parse(content) as ImportedQuestion[];
    
    if (!Array.isArray(imported)) {
      throw new Error('O conteúdo deve ser um array de questões');
    }

    const validatedQuestions = imported.map((q, index) => {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.correctAnswer !== 'number') {
        throw new Error(`Questão ${index + 1} tem formato inválido`);
      }
      if (q.correctAnswer < 0 || q.correctAnswer > 3) {
        throw new Error(`Questão ${index + 1}: resposta correta deve ser 0, 1, 2 ou 3`);
      }
      return {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ''
      };
    });

    setQuestions(validatedQuestions);
    toast({
      title: "Questões importadas!",
      description: `${validatedQuestions.length} questões foram importadas com sucesso.`,
    });
  };

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

  const onSubmit = (data: z.infer<typeof exerciseSchema>) => {
    if (questions.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma pergunta ao exercício.",
        variant: "destructive",
      });
      return;
    }

    const newExercise: Exercise = {
      id: exercise?.id || crypto.randomUUID(),
      subjectId: data.subjectId,
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      isSimulado: data.isSimulado,
      isTBL: exercise?.isTBL || false,
      questions: questions.map((q, index) => ({
        ...q,
        id: crypto.randomUUID(),
      })),
      createdAt: exercise?.createdAt || new Date(),
      lastReviewedAt: exercise?.lastReviewedAt,
      nextReviewAt: exercise?.nextReviewAt || new Date(),
      reviewCount: exercise?.reviewCount || 0,
      successRate: exercise?.successRate || 0,
      interval: exercise?.interval || 1,
      repetitions: exercise?.repetitions || 0,
      easinessFactor: exercise?.easinessFactor || 2.5,
    };

    onSave(newExercise);
    toast({
      title: "Sucesso",
      description: exercise ? "Exercício atualizado com sucesso!" : "Exercício criado com sucesso!",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{exercise ? 'Editar Exercício' : 'Novo Exercício'}</CardTitle>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isSimulado"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Questão de Simulado
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Marcar como questão especial de simulado
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isTBL"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Questão de TBL
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Marcar como questão de Team-Based Learning
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Questões de Múltipla Escolha</CardTitle>
            <div className="flex gap-2">
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Code className="h-4 w-4 mr-2" />
                    Importar Questões
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Importar Questões</DialogTitle>
                    <DialogDescription>
                      Escolha como deseja importar suas questões: através de arquivo JSON ou colando o código diretamente.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="paste" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="paste" className="flex items-center gap-2">
                        <Clipboard className="h-4 w-4" />
                        Colar JSON
                      </TabsTrigger>
                      <TabsTrigger value="file" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Arquivo JSON
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="paste" className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cole seu código JSON aqui:</label>
                        <Textarea
                          placeholder="Cole o código JSON das questões aqui..."
                          value={jsonInput}
                          onChange={(e) => setJsonInput(e.target.value)}
                          className="min-h-[200px] font-mono text-sm"
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleJsonPaste}
                            disabled={!jsonInput.trim()}
                            className="flex-1"
                          >
                            <Clipboard className="h-4 w-4 mr-2" />
                            Importar do Texto
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setJsonInput('')}
                            disabled={!jsonInput.trim()}
                          >
                            Limpar
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="file" className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Selecione um arquivo JSON:</label>
                        <div className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 rounded-lg p-6 text-center bg-muted/20 transition-colors">
                          <div className="relative">
                            <input
                              type="file"
                              accept=".json"
                              onChange={handleFileImport}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm text-foreground">
                                Clique aqui ou arraste um arquivo JSON
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Apenas arquivos .json são aceitos
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <h4 className="text-sm font-medium mb-2 text-foreground">Formato esperado:</h4>
                    <pre className="text-xs bg-background p-3 rounded border overflow-x-auto text-foreground">
{`[
  {
    "question": "Qual é a função do coração?",
    "options": [
      "Bombear sangue",
      "Filtrar toxinas", 
      "Produzir hormônios",
      "Armazenar energia"
    ],
    "correctAnswer": 0,
    "explanation": "O coração é responsável por bombear sangue pelo corpo."
  },
  {
    "question": "Outra pergunta...",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 1,
    "explanation": "Explicação opcional"
  }
]`}
                    </pre>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>• <code className="bg-muted px-1 rounded text-foreground">correctAnswer</code>: índice da resposta correta (0, 1, 2 ou 3)</p>
                      <p>• <code className="bg-muted px-1 rounded text-foreground">explanation</code>: campo opcional para explicação</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button onClick={addQuestion} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Questão
              </Button>
            </div>
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