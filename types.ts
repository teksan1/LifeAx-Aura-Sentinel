
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

export interface TemporalSchedule {
    date: string; // YYYY-MM-DD
    tasks: ScheduledTask[];
    cognitivePeaks: { start: string; end: string; intensity: number }[];
}
