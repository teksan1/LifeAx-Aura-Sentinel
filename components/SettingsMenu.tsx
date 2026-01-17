
import React from 'react';
import { AppSettings, UserBaseline } from '../types';
import { GridIcon, SparklesIcon, ArrowUpIcon } from './Icons';

interface SettingsMenuProps {
    settings: AppSettings;
    onSettingsChange: (newSettings: AppSettings) => void;
    baseline: UserBaseline | null;
    onBaselineChange: (newBaseline: UserBaseline) => void;
    onPurge: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ settings, onSettingsChange, baseline, onBaselineChange, onPurge }) => {
    return (
        <div className="settings-menu scroll-content">
            <div className="settings-section">
                <h2>System Architecture</h2>
                <div className="setting-item">
                    <label>Authority Level</label>
                    <select 
                        value={settings.authorityLevel} 
                        onChange={e => onSettingsChange({...settings, authorityLevel: e.target.value as any})}
                    >
                        <option value="mentor">Mentor (Direct & Challenging)</option>
                        <option value="advisor">Advisor (Supportive & Socratic)</option>
                    </select>
                </div>
                <div className="setting-item">
                    <label>AI Temperature</label>
                    <input 
                        type="range" min="0" max="1" step="0.1" 
                        value={settings.temperature} 
                        onChange={e => onSettingsChange({...settings, temperature: parseFloat(e.target.value)})}
                    />
                    <span>{settings.temperature}</span>
                </div>
            </div>

            <div className="settings-section">
                <h2>Interface & UX</h2>
                <div className="setting-item">
                    <label>Visual Theme</label>
                    <select 
                        value={settings.theme} 
                        onChange={e => onSettingsChange({...settings, theme: e.target.value as any})}
                    >
                        <option value="sentinel-dark">Sentinel Dark</option>
                        <option value="high-contrast">High Contrast</option>
                        <option value="midnight">Midnight OLED</option>
                    </select>
                </div>
                <div className="setting-item toggle">
                    <label>Dynamic UI Intensity</label>
                    <input 
                        type="checkbox" 
                        checked={settings.uiIntensityEnabled} 
                        onChange={e => onSettingsChange({...settings, uiIntensityEnabled: e.target.checked})}
                    />
                </div>
                <div className="setting-item toggle">
                    <label>Haptic Feedback</label>
                    <input 
                        type="checkbox" 
                        checked={settings.vibrationFeedback} 
                        onChange={e => onSettingsChange({...settings, vibrationFeedback: e.target.checked})}
                    />
                </div>
            </div>

            <div className="settings-section">
                <h2>Advanced Intelligence</h2>
                <div className="setting-item toggle">
                    <label>Live Location Risk Engine</label>
                    <input 
                        type="checkbox" 
                        checked={settings.locationTracking} 
                        onChange={e => onSettingsChange({...settings, locationTracking: e.target.checked})}
                    />
                </div>
                <div className="setting-item toggle">
                    <label>Acoustic Behavioral Monitor</label>
                    <input 
                        type="checkbox" 
                        checked={settings.acousticMonitoring} 
                        onChange={e => onSettingsChange({...settings, acousticMonitoring: e.target.checked})}
                    />
                </div>
                <div className="setting-item toggle">
                    <label>Financial Enforcement</label>
                    <input 
                        type="checkbox" 
                        checked={settings.financialEnforcement} 
                        onChange={e => onSettingsChange({...settings, financialEnforcement: e.target.checked})}
                    />
                </div>
            </div>

            <div className="settings-section">
                <h2>Data & Privacy</h2>
                <div className="setting-item">
                    <label>Data Retention (Days)</label>
                    <input 
                        type="number" 
                        value={settings.dataRetentionDays} 
                        onChange={e => onSettingsChange({...settings, dataRetentionDays: parseInt(e.target.value)})}
                    />
                </div>
                <div className="setting-item toggle">
                    <label>Behavioral Probing</label>
                    <input 
                        type="checkbox" 
                        checked={settings.behavioralProbe} 
                        onChange={e => onSettingsChange({...settings, behavioralProbe: e.target.checked})}
                    />
                </div>
                <div className="setting-item toggle">
                    <label>Auto-Sync Schedule</label>
                    <input 
                        type="checkbox" 
                        checked={settings.autoSync} 
                        onChange={e => onSettingsChange({...settings, autoSync: e.target.checked})}
                    />
                </div>
            </div>

            {baseline && (
                <div className="settings-section">
                    <h2>Dossier Calibration</h2>
                    <div className="setting-item">
                        <label>Identity Handle</label>
                        <input 
                            type="text" 
                            value={baseline.name} 
                            onChange={e => onBaselineChange({...baseline, name: e.target.value})}
                        />
                    </div>
                    <div className="setting-item">
                        <label>Primary Objective</label>
                        <textarea 
                            value={baseline.primaryGoal} 
                            onChange={e => onBaselineChange({...baseline, primaryGoal: e.target.value})}
                        />
                    </div>
                </div>
            )}

            <div className="settings-actions">
                <button className="danger-btn" onClick={onPurge}>Purge All Records</button>
            </div>
        </div>
    );
};

export default SettingsMenu;
