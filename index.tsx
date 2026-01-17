import { GoogleGenAI } from '@google/genai';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

import { AppSettings, ViewType, UserBaseline, TemporalSchedule, ScheduledTask, ClinicalReport } from './types';
import { generateId } from './utils';
import { getApiKey, storeApiKey, purgeVault } from './security';

import DottedGlowBackground from './components/DottedGlowBackground';
import SideDrawer from './components/SideDrawer';
import FluidScheduler from './components/FluidScheduler';
import ArtifactCard from './components/ArtifactCard';
import TherapySession from './components/TherapySession';
import SettingsMenu from './components/SettingsMenu';
import FinancialCore from './components/FinancialCore';
import { 
    SparklesIcon, 
    ArrowUpIcon, 
    GridIcon 
} from './components/Icons';

const DEFAULT_SETTINGS: AppSettings = {
    behavioralProbe: true,
    authorityLevel: 'mentor',
    syncInterval: 300,
    privacyMode: 'vault',
    theme: 'sentinel-dark',
    notifications: true,
    autoSync: true,
    dataRetentionDays: 30,
    uiIntensityEnabled: true,
    vibrationFeedback: true,
    language: 'English',
    riskProfiling: true,
    thinkingBudget: 100,
    temperature: 0.7
};

const INITIAL_BASELINE: UserBaseline = {
    name: '',
    primaryGoal: '',
    mainBlocker: '',
    wakeTime: '07:00',
    sleepTime: '23:00',
    authorityPreference: 'mentor',
    severityLevel: 3
};

const App = () => {
  const [activeView, setActiveView] = useState<ViewType>('auth');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'sentinel'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [drawerState, setDrawerState] = useState<{isOpen: boolean, mode: 'settings' | 'dossier', title: string}>({
    isOpen: false,
    mode: 'settings',
    title: 'System Arch'
  });

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [baseline, setBaseline] = useState<UserBaseline | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [tempBaseline, setTempBaseline] = useState<UserBaseline>(INITIAL_BASELINE);
  const [schedule, setSchedule] = useState<TemporalSchedule | null>(null);
  const [uiIntensity, setUiIntensity] = useState<number>(0.1);
  const [activeReport, setActiveReport] = useState<any>(null);
  const [isTherapyActive, setIsTherapyActive] = useState<boolean>(false);
  const [clinicalReports, setClinicalReports] = useState<ClinicalReport[]>([]);
  const [activeClinicalReport, setActiveClinicalReport] = useState<ClinicalReport | null>(null);
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [locationRisk, setLocationRisk] = useState<number>(0);
  
  // Auth state
  const [loginId, setLoginId] = useState('');
  const [accessCode, setAccessCode] = useState('');

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
            // NOTE: Clinical Reports are EXEMPT from this protocol and are never to be automatically deleted.
            if (currentSchedule && currentSchedule.frictionLogs) {
                const thirtyDaysAgo = Date.now() - 2592000000;
                const freshLogs = currentSchedule.frictionLogs.filter(log => log.timestamp > thirtyDaysAgo);
                if (freshLogs.length !== currentSchedule.frictionLogs.length) {
                    currentSchedule = { ...currentSchedule, frictionLogs: freshLogs };
                    localStorage.setItem('sentinel_schedule', JSON.stringify(currentSchedule));
                }
            }
            setSchedule(currentSchedule);
            
            const savedReports = localStorage.getItem('clinical_reports');
            if (savedReports) setClinicalReports(JSON.parse(savedReports));
            
            const savedFinance = localStorage.getItem('sentinel_finance');
            if (savedFinance) {
                const { accounts, budgets } = JSON.parse(savedFinance);
                setFinancialAccounts(accounts);
                setBudgets(budgets);
            } else {
                const initialBudgets: Budget[] = [
                    { category: 'Strategic Investment', limit: 1000, spent: 200, period: 'monthly', enforcementLevel: 'advisory' },
                    { category: 'Friction (Alcohol/Distraction)', limit: 200, spent: 50, period: 'weekly', enforcementLevel: 'lockdown' }
                ];
                setBudgets(initialBudgets);
            }

            const lastReportTime = localStorage.getItem('last_report_time');
            const now = Date.now();
            if (!lastReportTime || now - parseInt(lastReportTime) > 604800000) {
                generateClinicalReport('weekly');
            }
            
            setActiveView('home');
        } else {
            setActiveView('onboarding');
        }
    }
  }, []);

  const generateClinicalReport = async (type: 'weekly' | 'monthly' | 'gp_summary') => {
    if (!baseline || !schedule) return;
    try {
        const apiKey = getApiKey();
        if (!apiKey) return;
        const ai = new GoogleGenAI({ apiKey });
        const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        
        const context = `
            Type: ${type}
            User: ${baseline.name}
            Goal: ${baseline.primaryGoal}
            Friction Logs: ${JSON.stringify(schedule.frictionLogs || [])}
            Previous Reports: ${JSON.stringify(clinicalReports.slice(-3))}
        `;

        const prompt = `Generate a ${type} Clinical Progress Report. 
        Use semi-clinical, professional language as if written by a psychologist.
        Include:
        1. Behavioral patterns and mood stability assessment.
        2. Progress toward strategic objectives.
        3. Clinical markers (Mood Stability 0-100, Goal Alignment 0-100).
        4. Risk assessment (especially if mental health conditions are suspected).
        5. Future strategies.
        
        Context: ${context}
        
        Output ONLY a JSON object:
        {
            "content": "Full markdown formatted report text...",
            "markers": {"moodStability": 0-100, "goalAlignment": 0-100, "riskAssessment": "Low/Medium/High - details"}
        }`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            const newReport: ClinicalReport = {
                id: generateId(),
                type,
                dateGenerated: new Date().toLocaleDateString(),
                content: data.content,
                clinicalMarkers: data.markers
            };
            const updatedReports = [...clinicalReports, newReport];
            setClinicalReports(updatedReports);
            localStorage.setItem('clinical_reports', JSON.stringify(updatedReports));
            localStorage.setItem('last_report_time', Date.now().toString());
            setActiveClinicalReport(newReport);
        }
    } catch (e) {
        console.error("Clinical Report Generation Failed", e);
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

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginId && accessCode) {
        setIsAuthenticated(true);
        localStorage.setItem('lifeax_auth', 'true');
        storeApiKey(accessCode);
        
        const savedBaseline = localStorage.getItem('sentinel_baseline');
        if (savedBaseline) {
            setBaseline(JSON.parse(savedBaseline));
            setActiveView('home');
        } else {
            setActiveView('onboarding');
        }
    }
  };

  const handleOnboardingComplete = () => {
    setBaseline(tempBaseline);
    localStorage.setItem('sentinel_baseline', JSON.stringify(tempBaseline));
    setActiveView('home');
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
        Primary Goal: ${baseline.primaryGoal}. 
        Constraint: ${baseline.mainBlocker}.
        Output ONLY a JSON object: {"date": "YYYY-MM-DD", "tasks": [{"id": "...", "startTime": "HH:MM", "duration": minutes, "title": "...", "type": "deep-work|strategic|routine|rest", "status": "pending", "strictness": "fixed|flexible|fluid"}]}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            setSchedule(data);
            localStorage.setItem('sentinel_schedule', JSON.stringify(data));
        }
    } catch (e) {
        console.error("Schedule Generation Failed", e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string, attempt = 0) => {
    if (!text.trim() || cooldown > 0) return;
    
    const userMessage = { role: 'user' as const, text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
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

        const model = ai.getGenerativeModel({ model: currentModel });
        const chat = model.startChat({
            history: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })),
            generationConfig: { maxOutputTokens: 1000 }
        });

        const systemPrompt = `You are the Aura Sentinel, an ${authorityText} behavioral intelligence unit. 
        ${baselineContext}
        Your objective is to challenge blockers aggressively and optimize the user's temporal architecture. 
        Maintain a high-contrast, professional, and immersive tone.`;

        const result = await chat.sendMessage(systemPrompt + "\n\nUser: " + text);
        const fullResponse = result.response.text();
        
        setMessages(prev => [...prev, { role: 'sentinel', text: fullResponse }]);
        
        // Adaptive Chat-to-Schedule Sync
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
            Update the schedule based on this conversation. 
            Output ONLY the updated JSON tasks array.`;

            const syncResult = await model.generateContent(syncPrompt);
            const syncText = syncResult.response.text();
            const jsonMatch = syncText.match(/\[.*\]/s);
            if (jsonMatch && schedule) {
                const updatedTasks = JSON.parse(jsonMatch[0]);
                const newSchedule = { ...schedule, tasks: updatedTasks };
                setSchedule(newSchedule);
                localStorage.setItem('sentinel_schedule', JSON.stringify(newSchedule));
            }
        }

    } catch (error: any) {
        console.error("AI Error:", error);
        if (error.message?.includes('429') && attempt < models.length - 1) {
            handleSendMessage(text, attempt + 1);
            return;
        }
        setMessages(prev => [...prev, { role: 'sentinel', text: "SYSTEM ERROR: Intelligence link compromised. Cooling down..." }]);
        startCooldown(15);
    } finally {
        setIsLoading(false);
        setStatusText('');
    }
  };

  const onboardingSteps = [
    {
        title: "Designation",
        content: (
            <div className="onboarding-step">
                <p>Identify yourself to the Sentinel.</p>
                <input 
                    type="text" 
                    placeholder="Identity Handle" 
                    value={tempBaseline.name}
                    onChange={e => setTempBaseline({...tempBaseline, name: e.target.value})}
                />
                <button disabled={!tempBaseline.name} onClick={() => setOnboardingStep(1)}>Next</button>
            </div>
        )
    },
    {
        title: "Temporal Rhythm",
        content: (
            <div className="onboarding-step">
                <p>Define your biological operational window.</p>
                <div className="time-inputs">
                    <label>Wake: <input type="time" value={tempBaseline.wakeTime} onChange={e => setTempBaseline({...tempBaseline, wakeTime: e.target.value})} /></label>
                    <label>Sleep: <input type="time" value={tempBaseline.sleepTime} onChange={e => setTempBaseline({...tempBaseline, sleepTime: e.target.value})} /></label>
                </div>
                <button onClick={() => setOnboardingStep(2)}>Next</button>
            </div>
        )
    },
    {
        title: "Strategic Objectives",
        content: (
            <div className="onboarding-step">
                <p>What is your primary 90-day objective?</p>
                <textarea 
                    placeholder="Strategic Goal" 
                    value={tempBaseline.primaryGoal}
                    onChange={e => setTempBaseline({...tempBaseline, primaryGoal: e.target.value})}
                />
                <p>What is your main behavioral blocker?</p>
                <textarea 
                    placeholder="Friction Point" 
                    value={tempBaseline.mainBlocker}
                    onChange={e => setTempBaseline({...tempBaseline, mainBlocker: e.target.value})}
                />
                <button disabled={!tempBaseline.primaryGoal || !tempBaseline.mainBlocker} onClick={() => setOnboardingStep(3)}>Next</button>
            </div>
        )
    },
    {
        title: "Calibration",
        content: (
            <div className="onboarding-step">
                <p>Select Sentinel Authority Level.</p>
                <div className="radio-group">
                    <label><input type="radio" checked={tempBaseline.authorityPreference === 'mentor'} onChange={() => setTempBaseline({...tempBaseline, authorityPreference: 'mentor'})} /> Mentor (Direct)</label>
                    <label><input type="radio" checked={tempBaseline.authorityPreference === 'guide'} onChange={() => setTempBaseline({...tempBaseline, authorityPreference: 'guide'})} /> Guide (Socratic)</label>
                </div>
                <button onClick={handleOnboardingComplete}>Initialize Sentinel</button>
            </div>
        )
    }
  ];

  return (
    <>
        {isAuthenticated && (
            <nav className="top-nav">
                <div className="nav-logo">LIFEAX<span>SENTINEL</span></div>
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

            {isTherapyActive && (
                <TherapySession 
                    userBaseline={baseline}
                    onClose={() => setIsTherapyActive(false)}
                    onComplete={(insight, state, cbtData) => {
                        setIsTherapyActive(false);
                        handleSendMessage(`THERAPY_INSIGHT: ${insight}. Emotional State: ${state}. CBT Analysis: ${JSON.stringify(cbtData)}. Integrate this into my behavioral model.`);
                    }}
                />
            )}

            {activeClinicalReport && (
                <div className="artifact-overlay">
                    <div className="artifact-card clinical">
                        <div className="artifact-header">
                            <SparklesIcon />
                            <h3>{activeClinicalReport.type.toUpperCase()} CLINICAL REPORT</h3>
                            <button className="close-btn" onClick={() => setActiveClinicalReport(null)}>×</button>
                        </div>
                        <div className="artifact-body scroll-content" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="clinical-markers-grid">
                                <div className="marker">
                                    <label>Mood Stability</label>
                                    <div className="score">{activeClinicalReport.clinicalMarkers.moodStability}%</div>
                                </div>
                                <div className="marker">
                                    <label>Goal Alignment</label>
                                    <div className="score">{activeClinicalReport.clinicalMarkers.goalAlignment}%</div>
                                </div>
                                <div className="marker full">
                                    <label>Risk Assessment</label>
                                    <div className="risk-tag">{activeClinicalReport.clinicalMarkers.riskAssessment}</div>
                                </div>
                            </div>
                            <div className="clinical-content" dangerouslySetInnerHTML={{ __html: activeClinicalReport.content.replace(/\n/g, '<br/>') }} />
                        </div>
                        <div className="artifact-footer">
                            <button className="download-btn" onClick={() => window.print()}>Export for Medical Professional</button>
                        </div>
                    </div>
                </div>
            )}

            {activeView === 'auth' && (
                <div className="auth-overlay">
                    <form className="auth-modal" onSubmit={handleAuth}>
                        <h2>Identity Core</h2>
                        <p>Enter your credentials to synchronize with the Sentinel.</p>
                        <input type="text" placeholder="Identity Handle" value={loginId} onChange={e => setLoginId(e.target.value)} />
                        <input type="password" placeholder="Access Code" value={accessCode} onChange={e => setAccessCode(e.target.value)} />
                        <button type="submit">Synchronize</button>
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
                    <div className="home-header">
                        <h1>Aura Sentinel</h1>
                        <p>Welcome back, {baseline?.name || 'Agent'}</p>
                    </div>
                    
                    <div className="home-grid">
                        <div className="home-tile" onClick={() => setActiveView('chat')}>
                            <div className="tile-icon"><SparklesIcon /></div>
                            <h3>Intelligence</h3>
                            <p>Direct behavioral probe and AI dialogue.</p>
                        </div>
                        <div className="home-tile" onClick={() => setActiveView('scheduler')}>
                            <div className="tile-icon"><GridIcon /></div>
                            <h3>Scheduler</h3>
                            <p>Visual temporal mapping and task management.</p>
                        </div>
                        <div className="home-tile special" onClick={() => setIsTherapyActive(true)}>
                            <div className="tile-icon"><SparklesIcon /></div>
                            <h3>Therapy</h3>
                            <p>CBT-based psychological alignment.</p>
                        </div>
                        <div className="home-tile" onClick={() => setActiveView('reports')}>
                            <div className="tile-icon"><ArrowUpIcon /></div>
                            <h3>Clinical Reports</h3>
                            <p>Weekly, monthly, and GP-ready summaries.</p>
                        </div>
                        <div className="home-tile" onClick={() => setActiveView('finance')}>
                            <div className="tile-icon"><ArrowUpIcon /></div>
                            <h3>Finance</h3>
                            <p>Sovereign budgeting and bank enforcement.</p>
                        </div>
                        <div className="home-tile" onClick={() => setActiveView('settings')}>
                            <div className="tile-icon"><GridIcon /></div>
                            <h3>Settings</h3>
                            <p>System architecture and UI configuration.</p>
                        </div>
                    </div>
                </div>
            )}

            {activeView === 'finance' && (
                <FinancialCore 
                    accounts={financialAccounts}
                    budgets={budgets}
                    onUpdateBudget={(cat, amt) => {
                        const newBudgets = budgets.map(b => b.category === cat ? { ...b, spent: amt } : b);
                        setBudgets(newBudgets);
                        localStorage.setItem('sentinel_finance', JSON.stringify({ accounts: financialAccounts, budgets: newBudgets }));
                    }}
                    onAddAccount={(acc) => {
                        const newAccounts = [...financialAccounts, acc];
                        setFinancialAccounts(newAccounts);
                        localStorage.setItem('sentinel_finance', JSON.stringify({ accounts: newAccounts, budgets }));
                    }}
                />
            )}

            {activeView === 'settings' && (
                <SettingsMenu 
                    settings={settings}
                    onSettingsChange={setSettings}
                    baseline={baseline}
                    onBaselineChange={(newBaseline) => {
                        setBaseline(newBaseline);
                        localStorage.setItem('sentinel_baseline', JSON.stringify(newBaseline));
                    }}
                    onPurge={() => {
                        if(confirm("Are you sure? This will purge all behavioral data.")) {
                            localStorage.clear();
                            purgeVault();
                            window.location.reload();
                        }
                    }}
                />
            )}

            {activeView === 'reports' && (
                <div className="reports-page scroll-content">
                    <div className="home-header">
                        <h1>Clinical Reports</h1>
                        <button className="action-btn" onClick={() => generateClinicalReport('gp_summary')}>Generate GP Summary</button>
                    </div>
                    <div className="reports-list">
                        {clinicalReports.length === 0 ? (
                            <p className="empty-state">No reports generated yet. Complete your first week to see insights.</p>
                        ) : (
                            clinicalReports.map(report => (
                                <div key={report.id} className="report-item" onClick={() => setActiveClinicalReport(report)}>
                                    <div className="report-info">
                                        <span className="report-type">{report.type.toUpperCase()}</span>
                                        <span className="report-date">{report.dateGenerated}</span>
                                    </div>
                                    <div className="report-markers">
                                        <span>Mood: {report.clinicalMarkers.moodStability}%</span>
                                        <span>Goal: {report.clinicalMarkers.goalAlignment}%</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeView === 'chat' && (
                <div className="chat-interface">
                    <div className="chat-messages scroll-content">
                        {messages.map((m, i) => (
                            <div key={i} className={`message ${m.role}`}>
                                <div className="message-content">{m.text}</div>
                            </div>
                        ))}
                        {isLoading && <div className="status-indicator">{statusText}</div>}
                        {cooldown > 0 && <div className="cooldown-indicator">System Cooling: {cooldown}s</div>}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="chat-input-area">
                        <div className="input-wrapper">
                            <textarea 
                                value={input} 
                                onChange={e => setInput(e.target.value)}
                                placeholder="Input behavioral data..."
                                onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(input); } }}
                            />
                            <button onClick={() => handleSendMessage(input)} disabled={isLoading || cooldown > 0}>
                                <ArrowUpIcon />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeView === 'scheduler' && (
                <div className="scheduler-interface scroll-content">
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

        {isAuthenticated && (
            <div className="mobile-nav">
                <button className={`mobile-nav-item ${activeView === 'home' ? 'active' : ''}`} onClick={() => setActiveView('home')}>
                    <GridIcon />
                    <span>Home</span>
                </button>
                <button className={`mobile-nav-item ${activeView === 'chat' ? 'active' : ''}`} onClick={() => setActiveView('chat')}>
                    <SparklesIcon />
                    <span>Chat</span>
                </button>
                <button className={`mobile-nav-item ${activeView === 'scheduler' ? 'active' : ''}`} onClick={() => setActiveView('scheduler')}>
                    <GridIcon />
                    <span>Schedule</span>
                </button>
                <button className={`mobile-nav-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>
                    <GridIcon />
                    <span>Settings</span>
                </button>
            </div>
        )}
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
