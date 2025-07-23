import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar, Settings, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Exercise } from '@/types/medical';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GoogleCalendarIntegrationProps {
  pendingExercises: Exercise[];
}

export function GoogleCalendarIntegration({ pendingExercises }: GoogleCalendarIntegrationProps) {
  const [apiKey, setApiKey] = useLocalStorage('google-calendar-api-key', '');
  const [calendarId, setCalendarId] = useLocalStorage('google-calendar-id', 'primary');
  const [isEnabled, setIsEnabled] = useLocalStorage('google-calendar-enabled', false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCalendarEvent = async (exercise: Exercise) => {
    if (!apiKey) {
      toast({
        title: "API Key necessária",
        description: "Configure sua Google Calendar API key primeiro.",
        variant: "destructive"
      });
      return;
    }

    const event = {
      summary: `📚 Revisar: ${exercise.title}`,
      description: `Exercício de revisão espaçada\n\nMatéria: ${exercise.subjectId}\nQuestões: ${exercise.questions.length}\n\nCriado pelo app de revisão médica`,
      start: {
        dateTime: new Date(exercise.nextReviewAt).toISOString(),
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: new Date(new Date(exercise.nextReviewAt).getTime() + 30 * 60 * 1000).toISOString(), // 30 minutos depois
        timeZone: 'America/Sao_Paulo'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 10 },
          { method: 'email', minutes: 30 }
        ]
      }
    };

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  };

  const syncPendingExercises = async () => {
    if (!isEnabled || !apiKey) return;

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const exercise of pendingExercises) {
      try {
        await createCalendarEvent(exercise);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Erro ao sincronizar exercício ${exercise.title}:`, error);
      }
    }

    setIsLoading(false);

    if (successCount > 0) {
      toast({
        title: "Sincronização concluída",
        description: `${successCount} exercícios adicionados ao Google Calendar${errorCount > 0 ? `. ${errorCount} falharam.` : '.'}`,
      });
    } else if (errorCount > 0) {
      toast({
        title: "Erro na sincronização",
        description: `Falha ao sincronizar ${errorCount} exercícios. Verifique sua API key e configurações.`,
        variant: "destructive"
      });
    }
  };

  const testConnection = async () => {
    if (!apiKey) {
      toast({
        title: "API Key necessária",
        description: "Insira sua Google Calendar API key primeiro.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}?key=${apiKey}`
      );

      if (response.ok) {
        const calendar = await response.json();
        toast({
          title: "Conexão bem-sucedida",
          description: `Conectado ao calendário: ${calendar.summary}`,
        });
      } else {
        throw new Error(`Erro: ${response.status}`);
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Verifique sua API key e ID do calendário.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Integração Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Segurança:</strong> Para maior segurança das suas API keys, recomendamos{' '}
            <a href="/projects/settings/supabase" className="text-primary underline">
              conectar ao Supabase
            </a>. No momento, a chave será salva no seu navegador.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Google Calendar API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Obtenha sua API key em{' '}
              <a 
                href="https://console.cloud.google.com/apis/credentials" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Cloud Console
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calendar-id">ID do Calendário</Label>
            <Input
              id="calendar-id"
              placeholder="primary ou seu_email@gmail.com"
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use "primary" para seu calendário principal ou o email específico do calendário
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sincronização automática</Label>
              <p className="text-xs text-muted-foreground">
                Adicionar exercícios pendentes automaticamente
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={testConnection} 
            variant="outline" 
            disabled={isLoading || !apiKey}
          >
            <Settings className="h-4 w-4 mr-2" />
            Testar Conexão
          </Button>
          <Button 
            onClick={syncPendingExercises} 
            disabled={isLoading || !apiKey || !isEnabled || pendingExercises.length === 0}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {isLoading ? 'Sincronizando...' : `Sincronizar ${pendingExercises.length} exercícios`}
          </Button>
        </div>

        {pendingExercises.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum exercício pendente para sincronizar
          </p>
        )}
      </CardContent>
    </Card>
  );
}