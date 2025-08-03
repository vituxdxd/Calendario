import { useState, useEffect } from 'react';
import { Exercise } from '@/types/medical';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CheckCircle, AlertCircle, Loader2, ExternalLink, RotateCcw, CloudOff, Cloud } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoogleCalendarIntegrationProps {
  exercises: Exercise[];
  onSyncUpdate?: () => void;
  onSingleExerciseSync?: (exerciseId: string, isSync: boolean) => void;
  onFunctionsReady?: (functions: GoogleCalendarFunctions) => void;
}

export interface GoogleCalendarFunctions {
  syncSingle: (exerciseId: string) => Promise<boolean>;
  removeSingle: (exerciseId: string) => Promise<boolean>;
  isSync: (exerciseId: string) => boolean;
  needsUpdate: (exerciseId: string) => boolean;
  isAuthenticated: boolean;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

interface SyncedEvent {
  exerciseId: string;
  googleEventId: string;
  lastSyncDate: string;
  nextReviewAt: string; // Para detectar mudanças na data
}

// Função auxiliar para definir horário padrão (12:00) para eventos
const setDefaultTime = (dateString: string): string => {
  const date = new Date(dateString);
  // Define horário para 12:00 (meio-dia)
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
};

export function GoogleCalendarIntegration({ exercises, onSyncUpdate, onSingleExerciseSync, onFunctionsReady }: GoogleCalendarIntegrationProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncedEvents, setSyncedEvents] = useState<number>(0);
  const [syncedEventsMap, setSyncedEventsMap] = useState<Record<string, SyncedEvent>>({});
  const [loadingExercises, setLoadingExercises] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Configurações do Google Calendar API
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
  const CALENDAR_ID = 'primary';

  // Verificar se as credenciais estão configuradas
  const hasCredentials = GOOGLE_CLIENT_ID && GOOGLE_API_KEY;

  useEffect(() => {
    // Verificar se o usuário já está autenticado
    checkAuthStatus();
    // Carregar mapa de eventos sincronizados
    loadSyncedEventsMap();
  }, []);

  const loadSyncedEventsMap = () => {
    try {
      const saved = localStorage.getItem('google_calendar_synced_events');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSyncedEventsMap(parsed);
        setSyncedEvents(Object.keys(parsed).length);
      }
    } catch (error) {
      console.error('Erro ao carregar mapa de eventos:', error);
    }
  };

  const saveSyncedEventsMap = (newMap: Record<string, SyncedEvent>) => {
    try {
      localStorage.setItem('google_calendar_synced_events', JSON.stringify(newMap));
      setSyncedEventsMap(newMap);
      setSyncedEvents(Object.keys(newMap).length);
    } catch (error) {
      console.error('Erro ao salvar mapa de eventos:', error);
    }
  };

  const checkAuthStatus = () => {
    const token = localStorage.getItem('google_calendar_token');
    if (token) {
      setIsAuthenticated(true);
      // Configurar o token no gapi.client se disponível
      if (window.gapi && window.gapi.client) {
        window.gapi.client.setToken({ access_token: token });
      }
    }
  };

  const loadGoogleAPI = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log('🔄 Iniciando carregamento das APIs do Google...');
      
      // Primeiro carrega o Google Identity Services
      if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        const gsiScript = document.createElement('script');
        gsiScript.src = 'https://accounts.google.com/gsi/client';
        gsiScript.onload = () => {
          console.log('✅ Google Identity Services carregado');
          loadGapiClient().then(resolve).catch(reject);
        };
        gsiScript.onerror = (error) => {
          console.error('❌ Erro ao carregar Google Identity Services:', error);
          reject(error);
        };
        document.head.appendChild(gsiScript);
      } else {
        console.log('✅ Google Identity Services já carregado');
        loadGapiClient().then(resolve).catch(reject);
      }
    });
  };

  const loadGapiClient = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
        const apiScript = document.createElement('script');
        apiScript.src = 'https://apis.google.com/js/api.js';
        apiScript.onload = () => {
          console.log('✅ Google API script carregado');
          initializeGapiClient().then(resolve).catch(reject);
        };
        apiScript.onerror = (error) => {
          console.error('❌ Erro ao carregar Google API script:', error);
          reject(error);
        };
        document.head.appendChild(apiScript);
      } else {
        console.log('✅ Google API script já carregado');
        initializeGapiClient().then(resolve).catch(reject);
      }
    });
  };

  const initializeGapiClient = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log('🔄 Inicializando cliente da API...');
      
      window.gapi.load('client', () => {
        console.log('✅ gapi.client carregado');
        
        window.gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        }).then(() => {
          console.log('✅ Cliente da API inicializado com sucesso');
          
          // Verificar se a API do calendário está disponível
          if (window.gapi.client.calendar) {
            console.log('✅ Google Calendar API carregada e disponível');
            resolve();
          } else {
            console.error('❌ Google Calendar API não disponível após inicialização');
            reject(new Error('Google Calendar API não carregada após inicialização'));
          }
        }).catch((error) => {
          console.error('❌ Erro ao inicializar cliente da API:', error);
          
          if (error.status === 403) {
            reject(new Error('API Key inválida ou sem permissões. Verifique as configurações no Google Cloud Console.'));
          } else {
            reject(error);
          }
        });
      });
    });
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      await loadGoogleAPI();
      
      // Usar Google Identity Services para autenticação
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/calendar.events',
        callback: (response: any) => {
          if (response.access_token) {
            localStorage.setItem('google_calendar_token', response.access_token);
            
            // Configurar o token no gapi.client
            if (window.gapi && window.gapi.client) {
              window.gapi.client.setToken({ access_token: response.access_token });
            }
            
            setIsAuthenticated(true);
            setIsLoading(false);
            
            toast({
              title: "Conectado com sucesso!",
              description: "Sua conta Google Calendar foi conectada.",
            });
          } else {
            throw new Error('Não foi possível obter token de acesso');
          }
        },
        error_callback: (error: any) => {
          console.error('Erro OAuth:', error);
          setIsLoading(false);
          
          let errorMessage = "Não foi possível conectar com o Google Calendar.";
          if (error.type === 'popup_closed') {
            errorMessage = "Login cancelado pelo usuário.";
          }
          
          toast({
            title: "Erro na autenticação",
            description: errorMessage,
            variant: "destructive",
          });
        }
      });
      
      client.requestAccessToken();
      
    } catch (error) {
      console.error('Erro detalhado na autenticação:', error);
      setIsLoading(false);
      
      toast({
        title: "Erro na autenticação",
        description: "Problema ao carregar APIs do Google. Verifique as configurações.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('google_calendar_token');
    localStorage.removeItem('google_calendar_synced_events');
    setIsAuthenticated(false);
    setSyncStatus('idle');
    setSyncedEvents(0);
    setSyncedEventsMap({});
    
    toast({
      title: "Desconectado",
      description: "Sua conta Google Calendar foi desconectada e histórico limpo.",
    });
  };

  // Função para limpar eventos órfãos (exercícios deletados)
  const cleanupOrphanedEvents = async () => {
    const currentExerciseIds = new Set(exercises.map(ex => ex.id));
    const orphanedEvents = Object.entries(syncedEventsMap).filter(
      ([exerciseId]) => !currentExerciseIds.has(exerciseId)
    );

    if (orphanedEvents.length > 0) {
      console.log(`🧹 Limpando ${orphanedEvents.length} eventos órfãos...`);
      
      for (const [exerciseId, syncedEvent] of orphanedEvents) {
        try {
          await deleteCalendarEvent(syncedEvent.googleEventId);
          console.log(`  🗑️ Evento órfão deletado: ${exerciseId}`);
        } catch (error) {
          console.warn(`  ⚠️ Erro ao deletar evento órfão ${exerciseId}:`, error);
        }
      }

      // Atualizar mapa removendo eventos órfãos
      const cleanedMap = Object.fromEntries(
        Object.entries(syncedEventsMap).filter(([exerciseId]) => 
          currentExerciseIds.has(exerciseId)
        )
      );
      
      saveSyncedEventsMap(cleanedMap);
      console.log(`✅ Limpeza concluída`);
    }
  };

  const syncExercisesToCalendar = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Não conectado",
        description: "Conecte-se primeiro ao Google Calendar.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');
    
    try {
      const token = localStorage.getItem('google_calendar_token');
      
      if (!token) {
        throw new Error('Token de acesso não encontrado. Faça login novamente.');
      }
      
      if (window.gapi && window.gapi.client) {
        window.gapi.client.setToken({ access_token: token });
      }
      
      console.log(`🔄 Iniciando sincronização inteligente de ${exercises.length} exercícios...`);
      
      // Primeiro, limpar eventos órfãos (exercícios deletados)
      await cleanupOrphanedEvents();
      
      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const newSyncedEventsMap = { ...syncedEventsMap };
      
      for (const exercise of exercises) {
        try {
          const exerciseId = exercise.id;
          const currentNextReviewAt = new Date(exercise.nextReviewAt).toISOString();
          const existingSyncedEvent = syncedEventsMap[exerciseId];
          
          console.log(`\n📋 Processando: "${exercise.title}"`);
          
          // Verificar se já foi sincronizado
          if (existingSyncedEvent) {
            console.log(`  ℹ️ Exercício já sincronizado. Evento Google: ${existingSyncedEvent.googleEventId}`);
            
            // Verificar se a data mudou
            if (existingSyncedEvent.nextReviewAt !== currentNextReviewAt) {
              console.log(`  🔄 Data mudou de ${new Date(existingSyncedEvent.nextReviewAt).toLocaleString()} para ${new Date(currentNextReviewAt).toLocaleString()}`);
              
              // Deletar evento antigo
              try {
                await deleteCalendarEvent(existingSyncedEvent.googleEventId);
                console.log(`  Evento antigo deletado`);
              } catch (deleteError) {
                console.warn(`  Erro ao deletar evento antigo (continuando):`, deleteError);
              }
              
              // Criar novo evento
              const startDateTime = setDefaultTime(currentNextReviewAt);
              const endDateTime = setDefaultTime(new Date(new Date(exercise.nextReviewAt).getTime() + 60 * 60 * 1000).toISOString());
              
              const event: CalendarEvent = {
                id: `medstride_${exercise.id}`,
                summary: `📚 Revisão: ${exercise.title}`,
                description: `Exercício de ${exercise.subjectId}\n\nDificuldade: ${exercise.difficulty}\nQuestões: ${exercise.questions.length}\n\nCriado pelo Med Stride Calendar`,
                start: {
                  dateTime: startDateTime,
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                end: {
                  dateTime: endDateTime,
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
              };

              const newEventResult = await createCalendarEvent(event);
              
              // Atualizar mapa com novo evento
              newSyncedEventsMap[exerciseId] = {
                exerciseId,
                googleEventId: newEventResult.id,
                lastSyncDate: new Date().toISOString(),
                nextReviewAt: currentNextReviewAt
              };
              
              updatedCount++;
              console.log(`  ✅ Evento atualizado com novo ID: ${newEventResult.id}`);
            } else {
              console.log(`  ⏭️ Data não mudou, pulando (evitando duplicata)`);
              skippedCount++;
            }
          } else {
            // Exercício ainda não foi sincronizado - criar novo
            console.log(`  🆕 Exercício não sincronizado, criando novo evento`);
            
            const startDateTime = setDefaultTime(currentNextReviewAt);
            const endDateTime = setDefaultTime(new Date(new Date(exercise.nextReviewAt).getTime() + 60 * 60 * 1000).toISOString());
            
            const event: CalendarEvent = {
              id: `medstride_${exercise.id}`,
              summary: `📚 Revisão: ${exercise.title}`,
              description: `Exercício de ${exercise.subjectId}\n\nDificuldade: ${exercise.difficulty}\nQuestões: ${exercise.questions.length}\n\nCriado pelo Med Stride Calendar`,
              start: {
                dateTime: startDateTime,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              end: {
                dateTime: endDateTime,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
            };

            const newEventResult = await createCalendarEvent(event);
            
            // Adicionar ao mapa
            newSyncedEventsMap[exerciseId] = {
              exerciseId,
              googleEventId: newEventResult.id,
              lastSyncDate: new Date().toISOString(),
              nextReviewAt: currentNextReviewAt
            };
            
            createdCount++;
            console.log(`  ✅ Novo evento criado com ID: ${newEventResult.id}`);
          }
        } catch (eventError) {
          console.error(`❌ Erro ao processar "${exercise.title}":`, eventError);
        }
      }

      // Salvar mapa atualizado
      saveSyncedEventsMap(newSyncedEventsMap);

      const totalProcessed = createdCount + updatedCount + skippedCount;
      if (totalProcessed > 0) {
        setSyncStatus('success');
        
        let message = [];
        if (createdCount > 0) message.push(`${createdCount} novos`);
        if (updatedCount > 0) message.push(`${updatedCount} atualizados`);
        if (skippedCount > 0) message.push(`${skippedCount} já sincronizados`);
        
        toast({
          title: "Sincronização inteligente concluída!",
          description: `Eventos: ${message.join(', ')}.`,
        });
        
        console.log(`\n🎉 Sincronização concluída:`);
        console.log(`  📊 Novos: ${createdCount}`);
        console.log(`  🔄 Atualizados: ${updatedCount}`);
        console.log(`  ⏭️ Pulados: ${skippedCount}`);
      } else {
        throw new Error('Nenhum exercício foi processado com sucesso.');
      }

      if (onSyncUpdate) {
        onSyncUpdate();
      }
    } catch (error: any) {
      console.error('❌ Erro geral na sincronização:', error);
      setSyncStatus('error');
      
      let errorMessage = "Não foi possível sincronizar com o Google Calendar.";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.message?.includes('Token') || error.message?.includes('401')) {
        localStorage.removeItem('google_calendar_token');
        setIsAuthenticated(false);
        errorMessage = "Sessão expirada. Conecte-se novamente.";
      }
      
      toast({
        title: "Erro na sincronização",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const createCalendarEvent = async (event: CalendarEvent) => {
    const token = localStorage.getItem('google_calendar_token');
    
    if (!token) {
      throw new Error('Token de acesso não encontrado');
    }
    
    if (!window.gapi || !window.gapi.client || !window.gapi.client.calendar) {
      throw new Error('API do Google Calendar não carregada');
    }
    
    try {
      console.log('Criando evento com dados:', {
        summary: event.summary,
        start: event.start,
        end: event.end
      });
      
      // Usar gapi.client diretamente para fazer a requisição
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: CALENDAR_ID,
        resource: {
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 30 },
              { method: 'email', minutes: 60 }
            ]
          }
        }
      });
      
      console.log('Resposta da API:', response);
      
      if (response.status !== 200) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.result;
    } catch (error: any) {
      console.error('Erro detalhado ao criar evento:', error);
      
      // Se o token expirou, tentar renovar
      if (error.status === 401) {
        localStorage.removeItem('google_calendar_token');
        setIsAuthenticated(false);
        throw new Error('Token expirado. Faça login novamente.');
      }
      
      // Se for erro 403, pode ser problema de permissões
      if (error.status === 403) {
        console.error('Erro 403 detalhado:', error.result);
        throw new Error('Sem permissão para acessar o calendário. Verifique se a Google Calendar API está habilitada.');
      }
      
      // Se for erro 400, problema nos dados
      if (error.status === 400) {
        console.error('Erro 400 - dados inválidos:', error.result);
        throw new Error('Dados do evento inválidos.');
      }
      
      // Outros erros
      const errorMsg = error.result?.error?.message || error.message || 'Erro desconhecido';
      throw new Error(`Erro na API: ${errorMsg}`);
    }
  };

  const deleteCalendarEvent = async (googleEventId: string) => {
    const token = localStorage.getItem('google_calendar_token');
    
    if (!token) {
      throw new Error('Token de acesso não encontrado');
    }
    
    if (!window.gapi || !window.gapi.client || !window.gapi.client.calendar) {
      throw new Error('API do Google Calendar não carregada');
    }
    
    try {
      console.log('🗑️ Deletando evento:', googleEventId);
      
      const response = await window.gapi.client.calendar.events.delete({
        calendarId: CALENDAR_ID,
        eventId: googleEventId
      });
      
      if (response.status === 204 || response.status === 200) {
        console.log('✅ Evento deletado com sucesso');
        return true;
      } else {
        console.warn('⚠️ Resposta inesperada ao deletar:', response.status);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erro ao deletar evento:', error);
      
      // Se o evento não existe mais (404), considerar como sucesso
      if (error.status === 404) {
        console.log('ℹ️ Evento já não existe no Google Calendar');
        return true;
      }
      
      // Se token expirou
      if (error.status === 401) {
        localStorage.removeItem('google_calendar_token');
        setIsAuthenticated(false);
        throw new Error('Token expirado. Faça login novamente.');
      }
      
      throw error;
    }
  };

  // Sincronizar um exercício individual
  const syncSingleExercise = async (exerciseId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Não conectado",
        description: "Conecte-se primeiro ao Google Calendar.",
        variant: "destructive",
      });
      return false;
    }

    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) {
      toast({
        title: "Erro",
        description: "Exercício não encontrado.",
        variant: "destructive",
      });
      return false;
    }

    // Adicionar ao estado de loading
    setLoadingExercises(prev => new Set([...prev, exerciseId]));

    try {
      const token = localStorage.getItem('google_calendar_token');
      if (!token || !window.gapi?.client) {
        throw new Error('API não carregada ou token inválido');
      }

      window.gapi.client.setToken({ access_token: token });

      const currentNextReviewAt = new Date(exercise.nextReviewAt).toISOString();
      const existingSyncedEvent = syncedEventsMap[exerciseId];

      console.log(`🔄 Sincronizando exercício individual: "${exercise.title}"`);

      // Se já existe, verificar se precisa atualizar
      if (existingSyncedEvent) {
        if (existingSyncedEvent.nextReviewAt !== currentNextReviewAt) {
          console.log(`  🔄 Atualizando data do evento...`);
          
          // Deletar evento antigo
          try {
            await deleteCalendarEvent(existingSyncedEvent.googleEventId);
          } catch (deleteError) {
            console.warn('  ⚠️ Erro ao deletar evento antigo:', deleteError);
          }

          // Criar novo evento
          const event: CalendarEvent = {
            id: `medstride_${exercise.id}`,
            summary: `📚 Revisão: ${exercise.title}`,
            description: `Exercício de ${exercise.subjectId}\n\nDificuldade: ${exercise.difficulty}\nQuestões: ${exercise.questions.length}\n\nCriado pelo Med Stride Calendar`,
            start: {
              dateTime: currentNextReviewAt,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
              dateTime: new Date(new Date(exercise.nextReviewAt).getTime() + 60 * 60 * 1000).toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          };

          const newEventResult = await createCalendarEvent(event);

          // Atualizar mapa
          const newMap = {
            ...syncedEventsMap,
            [exerciseId]: {
              exerciseId,
              googleEventId: newEventResult.id,
              lastSyncDate: new Date().toISOString(),
              nextReviewAt: currentNextReviewAt
            }
          };
          saveSyncedEventsMap(newMap);

          toast({
            title: "Exercício atualizado!",
            description: `"${exercise.title}" foi atualizado no Google Calendar.`,
          });
        } else {
          toast({
            title: "Já sincronizado",
            description: `"${exercise.title}" já está atualizado no Google Calendar.`,
          });
        }
      } else {
        // Criar novo evento
        console.log(`  🆕 Criando novo evento...`);
        
        const event: CalendarEvent = {
          id: `medstride_${exercise.id}`,
          summary: `📚 Revisão: ${exercise.title}`,
          description: `Exercício de ${exercise.subjectId}\n\nDificuldade: ${exercise.difficulty}\nQuestões: ${exercise.questions.length}\n\nCriado pelo Med Stride Calendar`,
          start: {
            dateTime: currentNextReviewAt,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: new Date(new Date(exercise.nextReviewAt).getTime() + 60 * 60 * 1000).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        };

        const newEventResult = await createCalendarEvent(event);

        // Adicionar ao mapa
        const newMap = {
          ...syncedEventsMap,
          [exerciseId]: {
            exerciseId,
            googleEventId: newEventResult.id,
            lastSyncDate: new Date().toISOString(),
            nextReviewAt: currentNextReviewAt
          }
        };
        saveSyncedEventsMap(newMap);

        toast({
          title: "Exercício sincronizado!",
          description: `"${exercise.title}" foi adicionado ao Google Calendar.`,
        });
      }

      if (onSingleExerciseSync) {
        onSingleExerciseSync(exerciseId, true);
      }

      return true;
    } catch (error: any) {
      console.error('❌ Erro ao sincronizar exercício:', error);
      
      let errorMessage = "Não foi possível sincronizar o exercício.";
      if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro na sincronização",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    } finally {
      // Remover do estado de loading
      setLoadingExercises(prev => {
        const newSet = new Set(prev);
        newSet.delete(exerciseId);
        return newSet;
      });
    }
  };

  // Remover um exercício individual do Google Calendar
  const removeSingleExercise = async (exerciseId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Não conectado",
        description: "Conecte-se primeiro ao Google Calendar.",
        variant: "destructive",
      });
      return false;
    }

    const exercise = exercises.find(ex => ex.id === exerciseId);
    const syncedEvent = syncedEventsMap[exerciseId];

    if (!exercise || !syncedEvent) {
      toast({
        title: "Não encontrado",
        description: "Exercício não está sincronizado com o Google Calendar.",
        variant: "destructive",
      });
      return false;
    }

    // Adicionar ao estado de loading
    setLoadingExercises(prev => new Set([...prev, exerciseId]));

    try {
      console.log(`🗑️ Removendo exercício do Google Calendar: "${exercise.title}"`);
      
      await deleteCalendarEvent(syncedEvent.googleEventId);

      // Remover do mapa
      const newMap = { ...syncedEventsMap };
      delete newMap[exerciseId];
      saveSyncedEventsMap(newMap);

      toast({
        title: "Exercício removido!",
        description: `"${exercise.title}" foi removido do Google Calendar.`,
      });

      if (onSingleExerciseSync) {
        onSingleExerciseSync(exerciseId, false);
      }

      return true;
    } catch (error: any) {
      console.error('❌ Erro ao remover exercício:', error);
      
      // Se o evento não existe mais, considerar como sucesso
      if (error.message?.includes('404') || error.message?.includes('não existe')) {
        const newMap = { ...syncedEventsMap };
        delete newMap[exerciseId];
        saveSyncedEventsMap(newMap);

        toast({
          title: "Exercício removido!",
          description: `"${exercise.title}" foi removido (evento não existia mais).`,
        });

        if (onSingleExerciseSync) {
          onSingleExerciseSync(exerciseId, false);
        }

        return true;
      }

      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o exercício do Google Calendar.",
        variant: "destructive",
      });

      return false;
    } finally {
      // Remover do estado de loading
      setLoadingExercises(prev => {
        const newSet = new Set(prev);
        newSet.delete(exerciseId);
        return newSet;
      });
    }
  };

  // Verificar se um exercício está sincronizado
  const isExerciseSynced = (exerciseId: string) => {
    return !!syncedEventsMap[exerciseId];
  };

  // Verificar se um exercício precisa ser atualizado
  const exerciseNeedsUpdate = (exerciseId: string) => {
    const syncedEvent = syncedEventsMap[exerciseId];
    const exercise = exercises.find(ex => ex.id === exerciseId);
    
    if (!syncedEvent || !exercise) return false;
    
    const currentNextReviewAt = new Date(exercise.nextReviewAt).toISOString();
    return syncedEvent.nextReviewAt !== currentNextReviewAt;
  };

  // Exportar funções para componentes filhos
  useEffect(() => {
    if (onFunctionsReady) {
      const functions: GoogleCalendarFunctions = {
        syncSingle: syncSingleExercise,
        removeSingle: removeSingleExercise,
        isSync: isExerciseSynced,
        needsUpdate: exerciseNeedsUpdate,
        isAuthenticated
      };
      onFunctionsReady(functions);
    }
  }, [isAuthenticated, syncedEventsMap, onFunctionsReady]);

  return (
    <Card className="border-0 shadow-soft bg-gradient-card backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Google Calendar
          </CardTitle>
          <Badge variant={isAuthenticated ? "default" : "secondary"}>
            {isAuthenticated ? "Conectado" : "Desconectado"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!hasCredentials ? (
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            <div>
              <p className="font-medium text-sm mb-2">Configuração Necessária</p>
              <p className="text-xs text-muted-foreground mb-4">
                Para usar a integração com Google Calendar, você precisa configurar as credenciais da API.
              </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg text-left">
              <p className="text-xs font-medium mb-2">📋 Passos rápidos:</p>
              <ol className="text-xs text-muted-foreground space-y-1">
                <li>1. Acesse console.cloud.google.com</li>
                <li>2. Habilite Google Calendar API</li>
                <li>3. Crie credenciais OAuth 2.0</li>
                <li>4. Configure arquivo .env</li>
              </ol>
            </div>
            <Badge variant="outline" className="text-xs">
              Veja GOOGLE_CALENDAR_SETUP.md para detalhes
            </Badge>
          </div>
        ) : !isAuthenticated ? (
          <div className="text-center space-y-4">
            <Calendar className="h-12 w-12 text-blue-500 mx-auto" />
            <div>
              <p className="font-medium text-sm mb-2">Conectar Google Calendar</p>
              <p className="text-xs text-muted-foreground mb-4">
                Sincronize seus exercícios automaticamente com sua agenda.
              </p>
            </div>
            <Button 
              onClick={handleGoogleAuth} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Conectar Google Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Conta conectada</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                Desconectar
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{exercises.length}</p>
                <p className="text-xs text-muted-foreground">Exercícios totais</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{syncedEvents}</p>
                <p className="text-xs text-muted-foreground">Sincronizados</p>
              </div>
            </div>

            {/* Status detalhado */}
            {syncedEvents > 0 && (
              <div className="text-xs text-muted-foreground text-center">
                <p>
                  {exercises.length - syncedEvents > 0 && `${exercises.length - syncedEvents} novos • `}
                  {Object.values(syncedEventsMap).some(event => 
                    exercises.find(ex => ex.id === event.exerciseId && 
                      new Date(ex.nextReviewAt).toISOString() !== event.nextReviewAt
                    )
                  ) && "Alguns com datas atualizadas • "}
                  Clique para sincronizar
                </p>
              </div>
            )}

            <Button 
              onClick={syncExercisesToCalendar}
              disabled={isSyncing || exercises.length === 0}
              className="w-full"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Exercícios'}
            </Button>

            {syncStatus === 'success' && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <div>
                  <p className="font-medium">Última sincronização: {format(new Date(), 'PPp', { locale: ptBR })}</p>
                  <p className="text-xs">Todos os exercícios estão atualizados no Google Calendar</p>
                </div>
              </div>
            )}

            {syncStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <div>
                  <p className="font-medium">Erro na última sincronização</p>
                  <p className="text-xs">Verifique sua conexão e permissões</p>
                </div>
              </div>
            )}

            {/* Controles individuais */}
            {exercises.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="text-sm font-medium text-center border-t pt-4">
                  Controles Individuais
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {exercises.map(exercise => {
                    const isSynced = isExerciseSynced(exercise.id);
                    const needsUpdate = exerciseNeedsUpdate(exercise.id);
                    
                    return (
                      <div key={exercise.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-xs">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{exercise.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {isSynced ? (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {needsUpdate ? 'Desatualizado' : 'Sincronizado'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Não sincronizado
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {isSynced ? (
                            <>
                              {needsUpdate && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => syncSingleExercise(exercise.id)}
                                  disabled={isSyncing || loadingExercises.has(exercise.id)}
                                  className="text-xs px-2 py-1 h-6"
                                >
                                  {loadingExercises.has(exercise.id) ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RotateCcw className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeSingleExercise(exercise.id)}
                                disabled={isSyncing || loadingExercises.has(exercise.id)}
                                className="text-xs px-2 py-1 h-6"
                              >
                                {loadingExercises.has(exercise.id) ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CloudOff className="h-3 w-3" />
                                )}
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => syncSingleExercise(exercise.id)}
                              disabled={isSyncing || loadingExercises.has(exercise.id)}
                              className="text-xs px-2 py-1 h-6"
                            >
                              {loadingExercises.has(exercise.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Cloud className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Adicionar tipos globais para window.gapi
declare global {
  interface Window {
    gapi: any;
    google: any;
    GoogleCalendarManager: {
      syncSingle: (exerciseId: string) => Promise<boolean>;
      removeSingle: (exerciseId: string) => Promise<boolean>;
      isSync: (exerciseId: string) => boolean;
      needsUpdate: (exerciseId: string) => boolean;
      isAuthenticated: boolean;
    };
  }
} 