
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface UserBaseline {
    name: string;
    wakeTime: string;
    sleepTime: string;
    energyPeak: string;
    primaryGoal: string;
    mainBlocker: string;
    workStyle: 'deep' | 'collaborative' | 'reactive';
    authorityPreference: 'mentor' | 'advisor';
}

export interface AppSettings {
    behavioralProbe: boolean;
    authorityLevel: 'advisor' | 'mentor';
    riskProfiling: boolean;
    thinkingBudget: number;
    temperature: number;
}

export type ViewType = 'home' | 'chat' | 'scheduler' | 'overview' | 'onboarding' | 'auth';

export interface ScheduledTask {
    id: string;
    title: string;
    startTime: string; // ISO string or HH:mm
    duration: number; // minutes
    type: 'deep-work' | 'routine' | 'rest' | 'strategic';
    strictness: 'fixed' | 'flexible' | 'fluid';
    status: 'pending' | 'completed' | 'missed' | 'rescheduled';
    description?: string;
}

export interface FrictionLog {
    taskId: string;
    timestamp: number;
    reason: string;
    impact: 'low' | 'medium' | 'high';
}

export interface TemporalSchedule {
    date: string; // YYYY-MM-DD
    tasks: ScheduledTask[];
    cognitivePeaks: { start: string; end: string; intensity: number }[];
    frictionLogs?: FrictionLog[];
}

export interface WeeklyReport {
    id: string;
    weekStarting: string;
    summary: string;
    pivotRecommendation: string;
    efficiencyScore: number;
}

export interface TherapySession {
    id: string;
    timestamp: number;
    transcript: { role: 'user' | 'sentinel'; text: string }[];
    coreInsight: string;
    emotionalState: string;
    cbtAnalysis?: {
        cognitiveDistortions: string[];
        behavioralHomework: string;
    };
}

export interface ClinicalReport {
    id: string;
    type: 'weekly' | 'monthly' | 'gp_summary';
    dateGenerated: string;
    content: string;
    clinicalMarkers: {
        moodStability: number;
        goalAlignment: number;
        riskAssessment: string;
    };
}
