import { useState } from 'react';
import { Subject, Exercise } from '@/types/medical';
import { medicalSubjects } from '@/utils/subjects';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit2, BookOpen, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SubjectManagerProps {
  exercises: Exercise[];
  onUpdateSubjects: (subjects: Subject[]) => void;
  onClose: () => void;
}

const availableColors = [
  'medical-primary',
  'medical-secondary', 
  'medical-accent',
  'medical-info',
  'medical-warning',
  'primary',
  'destructive',
  'secondary',
  'muted'
];

const availableIcons = ['🏥', '📚', '🔬', '🧬', '🩺', '🧠', '💊', '⚕️', '🔍', '📖', '🌍', '👋', '💡', '🎯', '📊'];

export function SubjectManager({ exercises, onUpdateSubjects, onClose }: SubjectManagerProps) {
  const [subjects, setSubjects] = useState<Subject[]>(medicalSubjects);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubject, setNewSubject] = useState({
    name: '',
    shortName: '',
    color: 'medical-primary',
    icon: '📚'
  });
  const { toast } = useToast();

  const getExerciseCount = (subjectId: string) => {
    return exercises.filter(ex => ex.subjectId === subjectId).length;
  };

  const handleAddSubject = () => {
    if (!newSubject.name.trim() || !newSubject.shortName.trim()) {
      toast({
        title: "Erro",
        description: "Nome e nome abreviado são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const subject: Subject = {
      id: `custom-${Date.now()}`,
      name: newSubject.name.trim(),
      shortName: newSubject.shortName.trim(),
      color: newSubject.color,
      icon: newSubject.icon
    };

    const updatedSubjects = [...subjects, subject];
    setSubjects(updatedSubjects);
    onUpdateSubjects(updatedSubjects);
    
    setNewSubject({ name: '', shortName: '', color: 'medical-primary', icon: '📚' });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Disciplina adicionada!",
      description: `${subject.shortName} foi adicionada com sucesso.`
    });
  };

  const handleEditSubject = () => {
    if (!editingSubject || !editingSubject.name.trim() || !editingSubject.shortName.trim()) {
      toast({
        title: "Erro",
        description: "Nome e nome abreviado são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const updatedSubjects = subjects.map(sub => 
      sub.id === editingSubject.id ? editingSubject : sub
    );
    setSubjects(updatedSubjects);
    onUpdateSubjects(updatedSubjects);
    
    setEditingSubject(null);
    setIsEditDialogOpen(false);
    
    toast({
      title: "Disciplina atualizada!",
      description: `${editingSubject.shortName} foi atualizada com sucesso.`
    });
  };

  const handleDeleteSubject = (subject: Subject) => {
    const exerciseCount = getExerciseCount(subject.id);
    
    if (exerciseCount > 0) {
      toast({
        title: "Não é possível remover a disciplina",
        description: `Existem ${exerciseCount} exercício(s) associado(s) a esta disciplina. Remova os exercícios primeiro.`,
        variant: "destructive"
      });
      return;
    }

    setSubjectToDelete(subject);
  };

  const confirmDelete = () => {
    if (!subjectToDelete) return;

    const updatedSubjects = subjects.filter(sub => sub.id !== subjectToDelete.id);
    setSubjects(updatedSubjects);
    onUpdateSubjects(updatedSubjects);
    
    toast({
      title: "Disciplina removida!",
      description: `${subjectToDelete.shortName} foi removida com sucesso.`
    });
    
    setSubjectToDelete(null);
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject({ ...subject });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Disciplinas</h2>
          <p className="text-muted-foreground">
            Adicione, edite ou remova disciplinas do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Disciplina
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Disciplina</DialogTitle>
                <DialogDescription>
                  Preencha os dados da nova disciplina
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                    placeholder="Ex: Anatomia Humana I"
                  />
                </div>
                <div>
                  <Label htmlFor="shortName">Nome Abreviado</Label>
                  <Input
                    id="shortName"
                    value={newSubject.shortName}
                    onChange={(e) => setNewSubject({...newSubject, shortName: e.target.value})}
                    placeholder="Ex: Anatomia I"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Cor</Label>
                  <Select 
                    value={newSubject.color} 
                    onValueChange={(color) => setNewSubject({...newSubject, color})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColors.map(color => (
                        <SelectItem key={color} value={color}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded bg-${color}`} />
                            {color}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="icon">Ícone</Label>
                  <Select 
                    value={newSubject.icon} 
                    onValueChange={(icon) => setNewSubject({...newSubject, icon})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableIcons.map(icon => (
                        <SelectItem key={icon} value={icon}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{icon}</span>
                            {icon}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddSubject}>
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {subjects.map((subject) => {
          const exerciseCount = getExerciseCount(subject.id);
          return (
            <Card key={subject.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{subject.icon}</span>
                    <div>
                      <h3 className="font-semibold">{subject.shortName}</h3>
                      <p className="text-sm text-muted-foreground">{subject.name}</p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {exerciseCount} exercício(s)
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditDialog(subject)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteSubject(subject)}
                      disabled={exerciseCount > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Disciplina</DialogTitle>
            <DialogDescription>
              Modifique os dados da disciplina
            </DialogDescription>
          </DialogHeader>
          {editingSubject && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome Completo</Label>
                <Input
                  id="edit-name"
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({...editingSubject, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-shortName">Nome Abreviado</Label>
                <Input
                  id="edit-shortName"
                  value={editingSubject.shortName}
                  onChange={(e) => setEditingSubject({...editingSubject, shortName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Cor</Label>
                <Select 
                  value={editingSubject.color} 
                  onValueChange={(color) => setEditingSubject({...editingSubject, color})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColors.map(color => (
                      <SelectItem key={color} value={color}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded bg-${color}`} />
                          {color}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-icon">Ícone</Label>
                <Select 
                  value={editingSubject.icon} 
                  onValueChange={(icon) => setEditingSubject({...editingSubject, icon})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIcons.map(icon => (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{icon}</span>
                          {icon}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSubject}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!subjectToDelete} onOpenChange={() => setSubjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a disciplina "{subjectToDelete?.shortName}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
