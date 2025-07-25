import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SchedulingOptionsProps {
  onSchedule: (date: Date | null) => void; // null for automatic
}

export function SchedulingOptions({ onSchedule }: SchedulingOptionsProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  return (
    <div className="space-y-4">
      <p className="text-center text-muted-foreground">Como você quer agendar a próxima revisão?</p>
      <div className="flex justify-center gap-4">
        <Button onClick={() => onSchedule(null)}>Automático</Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, 'PPP', { locale: ptBR }) : <span>Manual</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
            />
            <div className="p-2 border-t border-border">
              <Button disabled={!selectedDate} onClick={() => onSchedule(selectedDate!)} className="w-full">
                Agendar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}