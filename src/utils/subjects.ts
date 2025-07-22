import { Subject } from '@/types/medical';

export const medicalSubjects: Subject[] = [
  {
    id: 'pisco-ii',
    name: 'PISCO II (Programa de Interação Serviço, Saúde e Comunidade) - REDE',
    shortName: 'PISCO II',
    color: 'medical-primary',
    icon: '🏥'
  },
  {
    id: 'ingles-medico',
    name: 'INGLÊS MÉDICO',
    shortName: 'Inglês Médico',
    color: 'medical-info',
    icon: '🌍'
  },
  {
    id: 'libras',
    name: 'LÍNGUA BRASILEIRA DE SINAIS - LIBRAS',
    shortName: 'LIBRAS',
    color: 'medical-accent',
    icon: '👋'
  },
  {
    id: 'tutorial-ii-tbl',
    name: 'TUTORIAL II TBL: Funções Orgânicas/Mecanismos de Agressão e Defesa/Regulação e Excreção',
    shortName: 'Tutorial II TBL',
    color: 'medical-secondary',
    icon: '🧬'
  },
  {
    id: 'habilidades-psicologia',
    name: 'HABILIDADES MÉDICAS II SR-PSICOLOGIA',
    shortName: 'Habilidades - Psicologia',
    color: 'medical-warning',
    icon: '🧠'
  },
  {
    id: 'habilidades-propedeutica',
    name: 'HABILIDADES MÉDICAS II - PROPEDÊUTICA',
    shortName: 'Habilidades - Propedêutica',
    color: 'primary',
    icon: '🩺'
  },
  {
    id: 'morfofuncional-anatomia',
    name: 'MORFOFUNCIONAL II (ANATOMIA)',
    shortName: 'Anatomia',
    color: 'destructive',
    icon: '🦴'
  },
  {
    id: 'habilidades-sr',
    name: 'HABILIDADES MÉDICAS II SR',
    shortName: 'Habilidades SR',
    color: 'medical-secondary',
    icon: '⚕️'
  },
  {
    id: 'tutorial-ii-pbl',
    name: 'TUTORIAL II PBL: Funções Orgânicas/Mecanismos de Agressão e Defesa/Regulação e Excreção',
    shortName: 'Tutorial II PBL',
    color: 'accent',
    icon: '🔬'
  },
  {
    id: 'morfofuncional-histologia',
    name: 'MORFOFUNCIONAL II (HISTOLOGIA)',
    shortName: 'Histologia',
    color: 'medical-primary',
    icon: '🔬'
  }
];

export const getSubjectById = (id: string): Subject | undefined => {
  return medicalSubjects.find(subject => subject.id === id);
};

export const getSubjectColor = (subjectId: string): string => {
  const subject = getSubjectById(subjectId);
  return subject?.color || 'primary';
};