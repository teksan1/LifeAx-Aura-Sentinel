
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
    theme: 'sentinel-dark' | 'high-contrast' | 'midnight';
    notifications: boolean;
    autoSync: boolean;
    dataRetentionDays: number;
    uiIntensityEnabled: boolean;
    vibrationFeedback: boolean;
    language: string;
    locationTracking: boolean;
    acousticMonitoring: boolean;
    financialEnforcement: boolean;
}

export interface FinancialAccount {
    id: string;
    name: string;
    balance: number;
    currency: string;
    type: 'checking' | 'savings' | 'credit';
}

export interface Budget {
    category: string;
    limit: number;
    spent: number;
    period: 'weekly' | 'monthly';
    enforcementLevel: 'advisory' | 'strict' | 'lockdown';
}

export interface LocationRiskZone {
    id: string;
    name: string;
    type: 'business' | 'distraction' | 'neutral';
    coordinates: { lat: number; lng: number };
    radius: number; // meters
    riskFactor: number; // 0-1
}

export interface AcousticEvent {
    timestamp: number;
    type: 'order' | 'voice_pattern' | 'ambient';
    content: string;
    detectedSubstance?: string;
    estimatedCost?: number;
}

export type ViewType = 'home' | 'chat' | 'scheduler' | 'overview' | 'onboarding' | 'auth' | 'settings' | 'reports' | 'therapy';

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
