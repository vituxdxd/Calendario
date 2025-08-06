import { useState } from 'react';
import { Download, Upload, Database, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Exercise, StudySession } from '@/types/medical';

interface BackupData {
  exercises: Exercise[];
  studySessions: StudySession[];
  quizAnswers: Record<string, any[]>;
  userPreferences: {
    theme?: string;
    [key: string]: any;
  };
  metadata: {
    createdAt: string;
    version: string;
    totalQuestions: number;
    totalSubjects: number;
    appVersion?: string;
  };
}

interface BackupManagerProps {
  exercises: Exercise[];
  studySessions: StudySession[];
  onImportData: (data: { 
    exercises: Exercise[]; 
    studySessions: StudySession[]; 
    quizAnswers: Record<string, any[]>;
    userPreferences?: Record<string, any>;
  }) => void;
}

export const BackupManager = ({ exercises, studySessions, onImportData }: BackupManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingBackupData, setPendingBackupData] = useState<BackupData | null>(null);
  const { toast } = useToast();

  const generateBackup = (): BackupData => {
    // Coletar todas as respostas dos quizzes do localStorage
    const quizAnswers: Record<string, any[]> = {};
    
    // Buscar por todas as chaves que começam com "quiz-answers-"
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('quiz-answers-')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            quizAnswers[key] = JSON.parse(data);
          }
        } catch (error) {
          console.warn(`Erro ao ler dados do quiz: ${key}`, error);
        }
      }
    }

    // Coletar preferências do usuário
    const userPreferences: Record<string, any> = {};
    
    // Tema
    const theme = localStorage.getItem('vite-ui-theme');
    if (theme) {
      userPreferences.theme = theme;
    }

    // Calcular estatísticas
    const totalQuestions = exercises.reduce((sum, ex) => sum + ex.questions.length, 0);
    const uniqueSubjects = new Set(exercises.map(ex => ex.subjectId));

    return {
      exercises,
      studySessions,
      quizAnswers,
      userPreferences,
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.1.0',
        totalQuestions,
        totalSubjects: uniqueSubjects.size,
        appVersion: '1.0.0'
      }
    };
  };

  const exportBackup = () => {
    try {
      const backupData = generateBackup();
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `med-stride-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup exportado com sucesso!",
        description: `Arquivo salvo: med-stride-backup-${new Date().toISOString().split('T')[0]}.json`,
      });
    } catch (error) {
      console.error('Erro ao exportar backup:', error);
      toast({
        title: "Erro ao exportar backup",
        description: "Ocorreu um erro ao gerar o arquivo de backup.",
        variant: "destructive",
      });
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: "Formato de arquivo inválido",
        description: "Por favor, selecione um arquivo JSON.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const text = await file.text();
      const backupData: BackupData = JSON.parse(text);

      // Validar estrutura do backup (com retrocompatibilidade)
      if (!backupData.exercises || !Array.isArray(backupData.exercises)) {
        throw new Error('Estrutura de exercícios inválida no backup');
      }

      if (!backupData.studySessions || !Array.isArray(backupData.studySessions)) {
        throw new Error('Estrutura de sessões de estudo inválida no backup');
      }

      if (!backupData.quizAnswers || typeof backupData.quizAnswers !== 'object') {
        throw new Error('Estrutura de respostas dos quizzes inválida no backup');
      }

      // Retrocompatibilidade: se não há metadata, criar uma estrutura básica
      if (!backupData.metadata) {
        backupData.metadata = {
          createdAt: (backupData as any).createdAt || new Date().toISOString(),
          version: (backupData as any).version || '1.0.0',
          totalQuestions: backupData.exercises.reduce((sum, ex) => sum + ex.questions.length, 0),
          totalSubjects: new Set(backupData.exercises.map(ex => ex.subjectId)).size
        };
      }

      // Retrocompatibilidade: se não há userPreferences, criar um objeto vazio
      if (!backupData.userPreferences) {
        backupData.userPreferences = {};
      }

      // Validar estrutura de exercícios
      const validExercises = backupData.exercises.every(exercise => 
        exercise.id && 
        exercise.title && 
        exercise.questions && 
        Array.isArray(exercise.questions)
      );

      if (!validExercises) {
        throw new Error('Alguns exercícios no backup possuem estrutura inválida');
      }

      // Validar estrutura de sessões
      const validSessions = backupData.studySessions.every(session =>
        session.id &&
        session.exerciseId &&
        session.answersLog &&
        Array.isArray(session.answersLog)
      );

      if (!validSessions) {
        throw new Error('Algumas sessões de estudo no backup possuem estrutura inválida');
      }

      // Se chegou até aqui, o backup é válido
      // Mostrar diálogo de confirmação
      setPendingBackupData(backupData);
      setShowConfirmDialog(true);
      
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      toast({
        title: "Erro ao importar backup",
        description: error instanceof Error ? error.message : "Formato de arquivo inválido",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Limpar input
      event.target.value = '';
    }
  };

  const confirmImport = () => {
    if (!pendingBackupData) return;

    try {
      // Restaurar dados dos quizzes no localStorage
      Object.entries(pendingBackupData.quizAnswers).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.warn(`Erro ao restaurar dados do quiz: ${key}`, error);
        }
      });

      // Restaurar preferências do usuário
      if (pendingBackupData.userPreferences) {
        Object.entries(pendingBackupData.userPreferences).forEach(([key, value]) => {
          try {
            if (key === 'theme') {
              localStorage.setItem('vite-ui-theme', value as string);
            } else {
              localStorage.setItem(key, JSON.stringify(value));
            }
          } catch (error) {
            console.warn(`Erro ao restaurar preferência: ${key}`, error);
          }
        });
      }

      // Chamar callback para atualizar os dados principais
      onImportData({
        exercises: pendingBackupData.exercises,
        studySessions: pendingBackupData.studySessions,
        quizAnswers: pendingBackupData.quizAnswers,
        userPreferences: pendingBackupData.userPreferences
      });

      const version = pendingBackupData.metadata?.version || 'desconhecida';
      toast({
        title: "Backup importado com sucesso!",
        description: `${pendingBackupData.exercises.length} exercícios e ${pendingBackupData.studySessions.length} sessões restaurados (versão ${version}).`,
      });

      setIsOpen(false);
      
    } catch (error) {
      console.error('Erro ao aplicar backup:', error);
      toast({
        title: "Erro ao aplicar backup",
        description: "Ocorreu um erro ao aplicar os dados do backup.",
        variant: "destructive",
      });
    } finally {
      setShowConfirmDialog(false);
      setPendingBackupData(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  const backupStats = () => {
    const quizAnswersCount = Object.keys(localStorage).filter(key => 
      key.startsWith('quiz-answers-')
    ).length;

    return {
      exercises: exercises.length,
      studySessions: studySessions.length,
      quizAnswers: quizAnswersCount
    };
  };

  const stats = backupStats();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Database className="h-4 w-4" />
          Backup
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gerenciar Backup
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Estatísticas dos dados atuais */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dados Atuais</CardTitle>
              <CardDescription>
                Estado atual do seu progresso de estudos
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Exercícios:</span>
                  <span className="font-medium">{stats.exercises}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sessões de estudo:</span>
                  <span className="font-medium">{stats.studySessions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Registros de quiz:</span>
                  <span className="font-medium">{stats.quizAnswers}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Exportar backup */}
          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-sm mb-1">Exportar Backup</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Faça download dos seus dados de estudo para backup
              </p>
            </div>
            <Button onClick={exportBackup} className="w-full gap-2">
              <Download className="h-4 w-4" />
              Baixar Backup
            </Button>
          </div>

          <Separator />

          {/* Importar backup */}
          <div className="space-y-3">
            <div>
              <h3 className="font-medium text-sm mb-1">Importar Backup</h3>
              <p className="text-xs text-muted-foreground mb-3">
                ⚠️ Isso substituirá todos os dados atuais
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backup-file" className="sr-only">
                Arquivo de backup
              </Label>
              <Input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileImport}
                disabled={isImporting}
                className="cursor-pointer"
              />
              {isImporting && (
                <p className="text-xs text-muted-foreground">
                  Importando backup...
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Importação de Backup
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>⚠️ Atenção:</strong> Esta ação irá substituir todos os seus dados atuais pelos dados do backup.
              </p>
              {pendingBackupData && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p><strong>O backup contém:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>{pendingBackupData.exercises.length} exercícios</li>
                    <li>{pendingBackupData.studySessions.length} sessões de estudo</li>
                    <li>{Object.keys(pendingBackupData.quizAnswers).length} registros de quiz</li>
                    {pendingBackupData.metadata?.totalQuestions && (
                      <li>{pendingBackupData.metadata.totalQuestions} questões totais</li>
                    )}
                    {pendingBackupData.metadata?.totalSubjects && (
                      <li>{pendingBackupData.metadata.totalSubjects} disciplinas</li>
                    )}
                    {pendingBackupData.userPreferences?.theme && (
                      <li>Tema: {pendingBackupData.userPreferences.theme}</li>
                    )}
                  </ul>
                  <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                    {pendingBackupData.metadata.createdAt && (
                      <p><strong>Criado em:</strong> {formatDate(pendingBackupData.metadata.createdAt)}</p>
                    )}
                    {pendingBackupData.metadata.version && (
                      <p><strong>Versão:</strong> {pendingBackupData.metadata.version}</p>
                    )}
                  </div>
                </div>
              )}
              <p className="text-sm">
                Seus dados atuais serão perdidos permanentemente. Deseja continuar?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowConfirmDialog(false);
              setPendingBackupData(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmImport}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Importar Backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
