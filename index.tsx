
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from '@google/genai';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import { AppSettings, ViewType, UserBaseline, TemporalSchedule, ScheduledTask } from './types';
import { generateId } from './utils';
import { getApiKey, storeApiKey, purgeVault } from './security';

import DottedGlowBackground from './components/DottedGlowBackground';
import SideDrawer from './components/SideDrawer';
import FluidScheduler from './components/FluidScheduler';
import ArtifactCard from './components/ArtifactCard';
import { 
    SparklesIcon, 
    ArrowUpIcon, 
    GridIcon 
} from './components/Icons';
import { WeeklyReport } from './types';

const DEFAULT_SETTINGS: AppSettings = {
    behavioralProbe: true,
    authorityLevel: 'mentor',
    riskProfiling: true,
    thinkingBudget: 0,
    temperature: 0.7
};

const INITIAL_BASELINE: UserBaseline = {
    name: '',
    wakeTime: '07:00',
    sleepTime: '23:00',
    energyPeak: 'morning',
    primaryGoal: '',
    mainBlocker: '',
    workStyle: 'deep',
    authorityPreference: 'mentor'
};

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system-error';
    text: string;
    timestamp: number;
}

interface ChatInputProps {
    onSend: (text: string) => void;
    isLoading: boolean;
    onStop: () => void;
    errorMessage?: string | null;
    statusText?: string;
    cooldown: number;
}

const ChatInput = ({ onSend, isLoading, onStop, errorMessage, statusText, cooldown }: ChatInputProps) => {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!isLoading && !errorMessage && cooldown === 0) {
            inputRef.current?.focus();
        }
    }, [isLoading, errorMessage, cooldown]);

    const handleSend = () => {
        if (value.trim() && !isLoading && cooldown === 0) {
            onSend(value);
            setValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-input-container">
            {errorMessage && (
                <div className="chat-error-banner">
                    <span className="error-icon">⚠️</span>
                    {errorMessage}
                </div>
            )}
            {cooldown > 0 && (
                <div className="chat-cooldown-banner">
                    System Cooling: {cooldown}s remaining...
                </div>
            )}
            <div className={`chat-input-wrapper ${isLoading ? 'is-loading' : ''} ${errorMessage ? 'has-error' : ''} ${cooldown > 0 ? 'is-cooling' : ''}`}>
                {isLoading ? (
                    <div className="chat-loading-status">
                        <div className="loading-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <span>{statusText || 'Sentinel Analyzing...'}</span>
                        <button className="chat-stop-button" onClick={onStop}>Stop</button>
                    </div>
                ) : (
                    <textarea
                        ref={inputRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={cooldown > 0 ? `Rate Limit Recovery...` : "Transmit intelligence..."}
                        rows={1}
                        disabled={cooldown > 0}
                    />
                )}
                <button 
                    className="chat-submit-button" 
                    onClick={handleSend} 
                    disabled={!value.trim() || isLoading || cooldown > 0}
                >
                    <ArrowUpIcon />
                </button>
            </div>
        </div>
    );
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeView, setActiveView] = useState<ViewType>('auth');
  const [settings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [baseline, setBaseline] = useState<UserBaseline | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [tempBaseline, setTempBaseline] = useState<UserBaseline>(INITIAL_BASELINE);
  const [schedule, setSchedule] = useState<TemporalSchedule | null>(null);
  const [uiIntensity, setUiIntensity] = useState<number>(0.1);
  const [activeReport, setActiveReport] = useState<WeeklyReport | null>(null);
  
  // Auth state
  const [loginId, setLoginId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  const [drawerState, setDrawerState] = useState<{
      isOpen: boolean;
      mode: 'settings' | null;
      title: string;
  }>({ isOpen: false, mode: null, title: '' });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cooldownTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const sessionAuth = localStorage.getItem('lifeax_auth');
    if (sessionAuth === 'true') {
        setIsAuthenticated(true);
        const savedBaseline = localStorage.getItem('sentinel_baseline');
        if (savedBaseline) {
            setBaseline(JSON.parse(savedBaseline));
            const savedSchedule = localStorage.getItem('sentinel_schedule');
            let currentSchedule: TemporalSchedule | null = savedSchedule ? JSON.parse(savedSchedule) : null;
            
            // Data Decay Protocol: Purge friction logs older than 30 days to prevent bloat
            if (currentSchedule && currentSchedule.frictionLogs) {
                const thirtyDaysAgo = Date.now() - 2592000000;
                const freshLogs = currentSchedule.frictionLogs.filter(log => log.timestamp > thirtyDaysAgo);
                if (freshLogs.length !== currentSchedule.frictionLogs.length) {
                    currentSchedule = { ...currentSchedule, frictionLogs: freshLogs };
                    localStorage.setItem('sentinel_schedule', JSON.stringify(currentSchedule));
                }
            }
            
            setSchedule(currentSchedule);
            
            // Check for Weekly Report
            const lastReportTime = localStorage.getItem('last_report_time');
            const now = Date.now();
            if (!lastReportTime || now - parseInt(lastReportTime) > 604800000) {
                generateWeeklyReport();
            }
            
            setActiveView('home');
        } else {
            setActiveView('onboarding');
        }
    }
  }, []);

  const generateWeeklyReport = async () => {
    if (!baseline || !schedule) return;
    try {
        const apiKey = getApiKey();
        if (!apiKey) return;
        const ai = new GoogleGenAI({ apiKey });
        const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        
        const prompt = `Generate a Weekly Strategic Intelligence Report for ${baseline.name}.
        Goal: ${baseline.primaryGoal}.
        Recent Friction: ${JSON.stringify(schedule.frictionLogs || [])}.
        Output ONLY a JSON object: {"summary": "...", "pivotRecommendation": "...", "efficiencyScore": 0-100}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            const report: WeeklyReport = {
                id: generateId(),
                weekStarting: new Date().toLocaleDateString(),
                ...data
            };
            setActiveReport(report);
            localStorage.setItem('last_report_time', Date.now().toString());
        }
    } catch (e) {
        console.error("Report Generation Failed", e);
    }
  };

  useEffect(() => {
    if (activeView === 'chat') {
        chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, activeView]);

  // UI Intensity Syncing
  useEffect(() => {
    const updateIntensity = () => {
        if (!schedule) return;
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const activeTask = schedule.tasks.find(t => {
            const [h, m] = t.startTime.split(':').map(Number);
            const start = h * 60 + m;
            const end = start + t.duration;
            const current = now.getHours() * 60 + now.getMinutes();
            return current >= start && current < end;
        });

        if (activeTask) {
            if (activeTask.type === 'deep-work') setUiIntensity(0.8);
            else if (activeTask.type === 'strategic') setUiIntensity(0.6);
            else if (activeTask.type === 'routine') setUiIntensity(0.3);
            else setUiIntensity(0.1);
        } else {
            setUiIntensity(0.1);
        }
    };
    const interval = setInterval(updateIntensity, 60000);
    updateIntensity();
    return () => clearInterval(interval);
  }, [schedule]);

  const startCooldown = useCallback((seconds: number) => {
    setCooldown(seconds);
    if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = window.setInterval(() => {
        setCooldown(prev => {
            if (prev <= 1) {
                if (cooldownTimerRef.current) window.clearInterval(cooldownTimerRef.current);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !accessCode) return;
    setIsAuthenticated(true);
    localStorage.setItem('lifeax_auth', 'true');
    const savedBaseline = localStorage.getItem('sentinel_baseline');
    if (savedBaseline) {
        setBaseline(JSON.parse(savedBaseline));
        setActiveView('home');
    } else {
        setActiveView('onboarding');
    }
  };

  const generateSchedule = async () => {
    if (!baseline) return;
    const apiKey = getApiKey();
    if (!apiKey) {
        setApiError("Identity Core Key Missing. Please re-authenticate.");
        return;
    }
    setIsLoading(true);
    setStatusText('Synthesizing Temporal Map...');
    try {
        const ai = new GoogleGenAI({ apiKey });
        const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        
        const prompt = `Generate a fluid 24-hour schedule for ${baseline.name}. 
        Wake: ${baseline.wakeTime}, Sleep: ${baseline.sleepTime}. 
        Goal: ${baseline.primaryGoal}. Blocker: ${baseline.mainBlocker}.
        Output ONLY a JSON array of tasks with this structure: 
        [{"id": "unique-id", "title": "Task Name", "startTime": "HH:mm", "duration": 60, "type": "deep-work|routine|rest|strategic", "strictness": "fixed|flexible|fluid"}]
        Ensure tasks respect the wake/sleep times and focus on the primary goal. Use 'fixed' for critical deep work and 'fluid' for others.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
            const tasks = JSON.parse(jsonMatch[0]);
            const newSchedule: TemporalSchedule = {
                date: new Date().toISOString().split('T')[0],
                tasks,
                cognitivePeaks: []
            };
            setSchedule(newSchedule);
            localStorage.setItem('sentinel_schedule', JSON.stringify(newSchedule));
        }
    } catch (error) {
        console.error("Schedule Generation Failed:", error);
    } finally {
        setIsLoading(false);
        setStatusText('');
    }
  };

  const executeQuery = async (
    userText: string, 
    history: Message[], 
    onUpdate: (chunk: string) => void,
    attempt = 0
  ): Promise<void> => {
    const models = ['gemini-2.0-flash-exp'];
    const currentModel = models[0];
    setStatusText(attempt > 0 ? `Re-routing via ${currentModel}...` : 'Processing...');

    try {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error("API_KEY_MISSING");
        const ai = new GoogleGenAI({ apiKey });
        const authorityText = baseline?.authorityPreference === 'mentor' ? "authoritative mentor" : "advisory guide";
        const baselineContext = baseline ? 
            `USER DOSSIER: Identity: ${baseline.name}, Focus: ${baseline.primaryGoal}, Constraint: ${baseline.mainBlocker}.` : 
            'USER DOSSIER: Initializing.';

        const contextWindow = history.slice(-6).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));

        const responseStream = await ai.getGenerativeModel({ model: currentModel }).generateContentStream({
            contents: contextWindow,
            generationConfig: { 
                temperature: settings.temperature,
            },
            systemInstruction: `You are Aura Sentinel. ${baselineContext} 
            PROTOCOL: 1. Act as a ${authorityText}. 2. Challenge the user's blockers aggressively but constructively. 3. Ask EXACTLY ONE sharp question. 4. Text only.`
        });

        setStatusText('');
        let fullText = '';
        for await (const chunk of responseStream.stream) {
            if (abortControllerRef.current?.signal.aborted) return;
            fullText += chunk.text() || '';
            onUpdate(fullText);
        }
    } catch (error: any) {
        if (error.message?.includes("429") || error.message?.toLowerCase().includes("quota")) {
            startCooldown(15);
            setApiError("Global Traffic surge. System cooling (15s)...");
            throw error;
        }
        throw error;
    }
  };

  const handleSendMessage = useCallback(async (text: string) => {
    if (isLoading || cooldown > 0) return;
    setIsLoading(true);
    setApiError(null);
    const userMsgId = generateId();
    const assistantMsgId = generateId();
    abortControllerRef.current = new AbortController();

    const userMsg: Message = { id: userMsgId, role: 'user', text, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setActiveView('chat');

    try {
        setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', text: '', timestamp: Date.now() }]);
        
        let fullResponse = '';
        await executeQuery(text, newMessages, (content) => {
            fullResponse = content;
            setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, text: content } : m));
        });

        // Adaptive Sync Logic: Check if the AI response implies a schedule change
        if (fullResponse.toLowerCase().includes('schedule') || 
            fullResponse.toLowerCase().includes('move') || 
            fullResponse.toLowerCase().includes('update') ||
            fullResponse.toLowerCase().includes('plan')) {
            
            setStatusText('Analyzing Temporal Impact...');
            const apiKey = getApiKey();
            if (!apiKey) return;
            const ai = new GoogleGenAI({ apiKey });
            const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
            
            const syncPrompt = `Current Schedule: ${JSON.stringify(schedule?.tasks)}
            User said: "${text}"
            Sentinel said: "${fullResponse}"
            
            Based on this interaction, does the schedule need updating? 
            If YES, output ONLY the updated JSON array of tasks. 
            If NO, output "NO_CHANGE".
            High-risk tasks (strategic/deep-work) should only be moved if explicitly requested.`;

            const syncResult = await model.generateContent(syncPrompt);
            const syncText = syncResult.response.text();
            
            if (syncText.includes('[') && syncText.includes(']')) {
                const jsonMatch = syncText.match(/\[.*\]/s);
                if (jsonMatch) {
                    const updatedTasks = JSON.parse(jsonMatch[0]);
                    setSchedule(prev => prev ? { ...prev, tasks: updatedTasks } : null);
                    localStorage.setItem('sentinel_schedule', JSON.stringify({ ...schedule, tasks: updatedTasks }));
                    
                    setMessages(prev => [...prev, { 
                        id: generateId(), 
                        role: 'assistant', 
                        text: "SYSTEM: Temporal map synchronized. I've adjusted your schedule based on our intelligence exchange.", 
                        timestamp: Date.now() 
                    }]);
                }
            }
        }

        startCooldown(4);
    } catch (e: any) {
        console.error("Signal Lost:", e);
    } finally {
        setIsLoading(false);
        setStatusText('');
        abortControllerRef.current = null;
    }
  }, [isLoading, messages, settings, cooldown, startCooldown, baseline, schedule]);

  const finishOnboarding = () => {
    localStorage.setItem('sentinel_baseline', JSON.stringify(tempBaseline));
    setBaseline(tempBaseline);
    setActiveView('chat');
    handleSendMessage(`INITIALIZATION SYNC: Designation: ${tempBaseline.name}. Objective: ${tempBaseline.primaryGoal}. Constraint: ${tempBaseline.mainBlocker}. I am ready for behavioral analysis.`);
  };

  const onboardingSteps = [
    {
      title: "Designation",
      content: (
        <div className="onboarding-step">
          <label>Assign Identity</label>
          <input type="text" placeholder="Name/Handle" value={tempBaseline.name} onChange={e => setTempBaseline({...tempBaseline, name: e.target.value})} />
          <button className="onboarding-next" disabled={!tempBaseline.name} onClick={() => setOnboardingStep(1)}>Confirm Identity</button>
        </div>
      )
    },
    {
      title: "Temporal Rhythm",
      content: (
        <div className="onboarding-step">
          <div className="input-row">
            <div><label>Wake</label><input type="time" value={tempBaseline.wakeTime} onChange={e => setTempBaseline({...tempBaseline, wakeTime: e.target.value})} /></div>
            <div><label>Sleep</label><input type="time" value={tempBaseline.sleepTime} onChange={e => setTempBaseline({...tempBaseline, sleepTime: e.target.value})} /></div>
          </div>
          <button className="onboarding-next" onClick={() => setOnboardingStep(2)}>Calibrate Rhythm</button>
        </div>
      )
    },
    {
      title: "Strategic Objectives",
      content: (
        <div className="onboarding-step">
          <label>90-Day Objective</label>
          <textarea placeholder="Define your mission..." value={tempBaseline.primaryGoal} onChange={e => setTempBaseline({...tempBaseline, primaryGoal: e.target.value})} />
          <label>Primary Friction Point</label>
          <input type="text" placeholder="Blocker..." value={tempBaseline.mainBlocker} onChange={e => setTempBaseline({...tempBaseline, mainBlocker: e.target.value})} />
          <button className="onboarding-next" disabled={!tempBaseline.primaryGoal || !tempBaseline.mainBlocker} onClick={() => setOnboardingStep(3)}>Synchronize Objectives</button>
        </div>
      )
    },
    {
      title: "Severity Level",
      content: (
        <div className="onboarding-step">
          <label>Select Authority Mode</label>
          <div className="mode-selector">
            <div className={`mode-card ${tempBaseline.authorityPreference === 'mentor' ? 'active' : ''}`} onClick={() => setTempBaseline({...tempBaseline, authorityPreference: 'mentor'})}>
                <h4>Mentor</h4><p>High accountability.</p>
            </div>
            <div className={`mode-card ${tempBaseline.authorityPreference === 'advisor' ? 'active' : ''}`} onClick={() => setTempBaseline({...tempBaseline, authorityPreference: 'advisor'})}>
                <h4>Advisor</h4><p>Collaborative guidance.</p>
            </div>
          </div>
          <button className="onboarding-next" onClick={finishOnboarding}>Engage Aura Sentinel</button>
        </div>
      )
    }
  ];

  return (
    <>
        <SideDrawer isOpen={drawerState.isOpen} onClose={() => setDrawerState(s => ({...s, isOpen: false}))} title={drawerState.title}>
            <div className="settings-panel">
                <div className="settings-section">
                    <h3>Dossier Record</h3>
                    {baseline ? (
                        <div className="baseline-summary">
                            <p><strong>Identity:</strong> {baseline.name}</p>
                            <p><strong>Objective:</strong> {baseline.primaryGoal}</p>
                            <p><strong>Constraint:</strong> {baseline.mainBlocker}</p>
                            <button className="reset-btn" onClick={() => { localStorage.clear(); purgeVault(); window.location.reload(); }}>Purge All Records</button>
                        </div>
                    ) : <p>Calibration Incomplete.</p>}
                </div>
            </div>
        </SideDrawer>

        {isAuthenticated && (
            <nav className="main-nav">
                <div className="nav-brand" onClick={() => setActiveView('home')}>SENTINEL</div>
                <div className="nav-links">
                    <button className={activeView === 'home' ? 'active' : ''} onClick={() => setActiveView('home')}>Command</button>
                    <button className={activeView === 'chat' ? 'active' : ''} onClick={() => setActiveView('chat')}>Intelligence</button>
                    <button className={activeView === 'scheduler' ? 'active' : ''} onClick={() => setActiveView('scheduler')}>Scheduler</button>
                </div>
                <button className="settings-trigger-inline" onClick={() => setDrawerState({isOpen: true, mode: 'settings', title: 'System Arch'})}><GridIcon /></button>
            </nav>
        )}

        <div className="immersive-app">
            <DottedGlowBackground gap={24} speedScale={uiIntensity} opacity={0.5 + uiIntensity * 0.5} />

            {activeReport && (
                <ArtifactCard report={activeReport} onClose={() => setActiveReport(null)} />
            )}

            {activeView === 'auth' && (
                <div className="auth-overlay">
                    <form className="auth-modal" onSubmit={handleAuth}>
                        <h1>LifeAx</h1>
                        <p>Aura Sentinel Build. Identity validation required.</p>
                        <div className="auth-inputs">
                            <input type="text" placeholder="Identity Handle" value={loginId} onChange={e => setLoginId(e.target.value)} required />
                            <input type="password" placeholder="Access Code" value={accessCode} onChange={e => setAccessCode(e.target.value)} required />
                        </div>
                        <button type="submit" className="auth-btn">Initialize Identity Core</button>
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="billing-link">Security & API Protocols</a>
                    </form>
                </div>
            )}

            {activeView === 'onboarding' && (
                <div className="onboarding-overlay">
                    <div className="onboarding-container">
                        <h2>{onboardingSteps[onboardingStep].title}</h2>
                        {onboardingSteps[onboardingStep].content}
                    </div>
                </div>
            )}

            {activeView === 'home' && (
                <div className="home-page scroll-content">
                    <div className="home-header"><h1>Aura Command</h1><p>Status: Synchronized with {baseline?.name}</p></div>
                    <div className="home-grid">
                        <div className="home-tile" onClick={() => setActiveView('chat')}>
                            <div className="tile-icon"><SparklesIcon /></div>
                            <h3>Intelligence</h3>
                            <p>Direct behavioral probe and diagnostic routine mapping.</p>
                        </div>
                        <div className="home-tile" onClick={() => setActiveView('scheduler')}>
                            <div className="tile-icon"><GridIcon /></div>
                            <h3>Scheduler</h3>
                            <p>Visual temporal mapping based on dossier maturity.</p>
                        </div>
                    </div>
                </div>
            )}

            {activeView === 'chat' && (
                <div className="chat-container">
                    <div className="chat-history">
                        {messages.length === 0 && <div className="chat-empty"><h2>Sentinel Intelligence</h2><p>Dossier Active. Transmit status report.</p></div>}
                        {messages.map(m => <div key={m.id} className={`chat-message ${m.role}`}><div className="message-content">{m.text}</div></div>)}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="chat-footer">
                        <ChatInput onSend={handleSendMessage} isLoading={isLoading} onStop={() => abortControllerRef.current?.abort()} errorMessage={apiError} statusText={statusText} cooldown={cooldown} />
                    </div>
                </div>
            )}

            {activeView === 'scheduler' && (
                <div className="scroll-content">
                    <FluidScheduler 
                        schedule={schedule} 
                        onTaskUpdate={(id, updates) => {
                            if (!schedule) return;
                            const newTasks = schedule.tasks.map(t => t.id === id ? { ...t, ...updates } : t);
                            const newSchedule = { ...schedule, tasks: newTasks };
                            setSchedule(newSchedule);
                            localStorage.setItem('sentinel_schedule', JSON.stringify(newSchedule));
                        }}
                        onTaskDelete={(id) => {
                            if (!schedule) return;
                            const newTasks = schedule.tasks.filter(t => t.id !== id);
                            const newSchedule = { ...schedule, tasks: newTasks };
                            setSchedule(newSchedule);
                            localStorage.setItem('sentinel_schedule', JSON.stringify(newSchedule));
                        }}
                        onTaskAdd={(task) => {
                            if (!schedule) return;
                            const newTask = { ...task, id: generateId() };
                            const newSchedule = { ...schedule, tasks: [...schedule.tasks, newTask] };
                            setSchedule(newSchedule);
                            localStorage.setItem('sentinel_schedule', JSON.stringify(newSchedule));
                        }}
                        onRegenerate={generateSchedule}
                        onAddFriction={(taskId, reason) => {
                            if (!schedule) return;
                            const newLog = { taskId, reason, timestamp: Date.now(), impact: 'medium' as const };
                            const newSchedule = { 
                                ...schedule, 
                                frictionLogs: [...(schedule.frictionLogs || []), newLog] 
                            };
                            setSchedule(newSchedule);
                            localStorage.setItem('sentinel_schedule', JSON.stringify(newSchedule));
                            
                            // Trigger AI learning from friction
                            handleSendMessage(`SYSTEM_LOG: Friction detected in task ${taskId}. Reason: ${reason}. Analyze and adjust future temporal mapping.`);
                        }}
                    />
                </div>
            )}
        </div>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
