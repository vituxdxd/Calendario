import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/context/theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const getCurrentIcon = () => {
    if (theme === 'light') return Sun;
    if (theme === 'dark') return Moon;
    return Monitor;
  };

  const CurrentIcon = getCurrentIcon();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0 hover-lift shadow-soft hover:shadow-medium transition-all duration-300 bg-background/50 backdrop-blur border border-border/60"
        >
          <CurrentIcon className="h-4 w-4 text-foreground transition-transform group-hover:scale-110" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 glass-card border-0 shadow-xl">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={`cursor-pointer transition-colors ${theme === 'light' ? 'bg-primary/10 text-primary' : ''}`}
        >
          <Sun className="mr-2 h-4 w-4" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={`cursor-pointer transition-colors ${theme === 'dark' ? 'bg-primary/10 text-primary' : ''}`}
        >
          <Moon className="mr-2 h-4 w-4" />
          Escuro
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={`cursor-pointer transition-colors ${theme === 'system' ? 'bg-primary/10 text-primary' : ''}`}
        >
          <Monitor className="mr-2 h-4 w-4" />
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}