import { Subject } from '@/types/medical';

// Disciplinas padrão do sistema
export const defaultMedicalSubjects: Subject[] = [
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
    icon: '🔬'
  },
  {
    id: 'morfofuncional-histologia',
    name: 'MORFOFUNCIONAL II (HISTOLOGIA)',
    shortName: 'Histologia',
    color: 'medical-secondary',
    icon: '🔍'
  },
  {
    id: 'morfofuncional-embriologia',
    name: 'MORFOFUNCIONAL II (EMBRIOLOGIA)',
    shortName: 'Embriologia',
    color: 'medical-accent',
    icon: '🧬'
  },
  {
    id: 'fisiologia-cardiovascular',
    name: 'FISIOLOGIA II - CARDIOVASCULAR',
    shortName: 'Fisiologia Cardiovascular',
    color: 'medical-warning',
    icon: '❤️'
  },
  {
    id: 'fisiologia-respiratoria',
    name: 'FISIOLOGIA II - RESPIRATÓRIA',
    shortName: 'Fisiologia Respiratória',
    color: 'medical-info',
    icon: '🫁'
  },
  {
    id: 'fisiologia-renal',
    name: 'FISIOLOGIA II - RENAL',
    shortName: 'Fisiologia Renal',
    color: 'medical-primary',
    icon: '🩸'
  },
  {
    id: 'bioquimica-metabolismo',
    name: 'BIOQUÍMICA II - METABOLISMO',
    shortName: 'Bioquímica Metabolismo',
    color: 'primary',
    icon: '⚗️'
  },
  {
    id: 'farmacologia-basica',
    name: 'FARMACOLOGIA BÁSICA',
    shortName: 'Farmacologia',
    color: 'destructive',
    icon: '💊'
  },
  {
    id: 'patologia-geral',
    name: 'PATOLOGIA GERAL',
    shortName: 'Patologia',
    color: 'medical-secondary',
    icon: '🦠'
  },
  {
    id: 'microbiologia',
    name: 'MICROBIOLOGIA',
    shortName: 'Microbiologia',
    color: 'medical-accent',
    icon: '🔬'
  },
  {
    id: 'imunologia',
    name: 'IMUNOLOGIA',
    shortName: 'Imunologia',
    color: 'medical-warning',
    icon: '🛡️'
  },
  {
    id: 'parasitologia',
    name: 'PARASITOLOGIA',
    shortName: 'Parasitologia',
    color: 'medical-info',
    icon: '🐛'
  },
  {
    id: 'epidemiologia',
    name: 'EPIDEMIOLOGIA',
    shortName: 'Epidemiologia',
    color: 'medical-primary',
    icon: '📊'
  },
  {
    id: 'saude-publica',
    name: 'SAÚDE PÚBLICA',
    shortName: 'Saúde Pública',
    color: 'primary',
    icon: '🏛️'
  }
];

// Função para obter disciplinas (incluindo customizadas do localStorage)
export const getMedicalSubjects = (): Subject[] => {
  try {
    const customSubjects = localStorage.getItem('custom-subjects');
    if (customSubjects) {
      return JSON.parse(customSubjects);
    }
  } catch (error) {
    console.error('Erro ao carregar disciplinas customizadas:', error);
  }
  return defaultMedicalSubjects;
};

// Função para salvar disciplinas customizadas
export const saveMedicalSubjects = (subjects: Subject[]): void => {
  try {
    localStorage.setItem('custom-subjects', JSON.stringify(subjects));
  } catch (error) {
    console.error('Erro ao salvar disciplinas customizadas:', error);
  }
};

// Mantém compatibilidade com código existente
export const medicalSubjects = getMedicalSubjects();

export const getSubjectById = (id: string): Subject | undefined => {
  return getMedicalSubjects().find(subject => subject.id === id);
};

export const getSubjectColor = (subjectId: string): string => {
  const subject = getSubjectById(subjectId);
  return subject?.color || 'primary';
};