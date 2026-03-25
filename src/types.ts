export type UserRole = 'educator' | 'participant' | 'observer';

export interface UserProfile {
  uid: string;
  firstNameInitial: string;
  lastNameInitial: string;
  favoriteColor: string;
  role: UserRole;
}

export interface Reveal {
  type: 'image' | 'static' | 'external';
  url: string;
  attribution?: string;
  label?: string;
}

export interface Case {
  id: string;
  title: string;
  authorId: string;
  reveals: Reveal[];
  correctDiagnosis?: string;
  management?: string;
}

export interface Session {
  id: string;
  name: string;
  educatorId: string;
  status: 'setup' | 'active' | 'paused' | 'completed';
  currentCaseIndex: number;
  currentRevealIndex: number;
  isSubmissionOpen: boolean;
  isTeamLockOpen: boolean;
  caseIds: string[];
  config?: {
    caseCount: number;
    revealCountPerCase: number;
    revealOrder: 'sequential' | 'random';
    caseOrder: 'sequential' | 'random';
  };
  createdAt: string;
}

export interface Team {
  id: string;
  sessionId: string;
  name: string;
  memberIds: string[];
  lockedContent?: {
    findings: string;
    differential: string;
    topDiagnosis: string;
    management: string;
    revealLockedAt: number;
  };
}

export interface Submission {
  id: string;
  sessionId: string;
  caseId: string;
  userId: string;
  teamId: string;
  content: string;
  submittedAt: string;
}

export interface Score {
  id: string;
  sessionId: string;
  targetId: string;
  targetType: 'individual' | 'team';
  individualScore?: number;
  teamContentScore?: number;
  hotSeatScore?: number;
  lockBonus?: number;
  totalScore: number;
}
