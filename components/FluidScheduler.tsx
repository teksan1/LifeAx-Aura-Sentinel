
import React, { useState } from 'react';
import { ScheduledTask, TemporalSchedule } from '../types';
import { GridIcon, SparklesIcon } from './Icons';

interface FluidSchedulerProps {
    schedule: TemporalSchedule | null;
    onTaskUpdate: (taskId: string, updates: Partial<ScheduledTask>) => void;
    onTaskDelete: (taskId: string) => void;
    onTaskAdd: (task: Omit<ScheduledTask, 'id'>) => void;
    onRegenerate: () => void;
}

const FluidScheduler: React.FC<FluidSchedulerProps> = ({ schedule, onTaskUpdate, onTaskDelete, onTaskAdd, onRegenerate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'24h' | 'weekly'>('24h');

    if (!schedule) {
        return (
            <div className="scheduler-empty">
                <SparklesIcon />
                <h3>Temporal Engine Offline</h3>
                <p>Initialize your dossier to generate a fluid schedule.</p>
                <button className="init-btn" onClick={onRegenerate}>Generate Initial Schedule</button>
            </div>
        );
    }

    const render24hView = () => (
        <div className="timeline-24h">
            {schedule.tasks.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(task => (
                <div key={task.id} className={`task-card ${task.type} ${task.strictness} ${task.status}`}>
                    <div className="task-time">{task.startTime}</div>
                    <div className="task-info">
                        <h4>{task.title}</h4>
                        <p>{task.duration}m • {task.strictness.toUpperCase()}</p>
                    </div>
                    <div className="task-actions">
                        <button className="action-btn complete" onClick={() => onTaskUpdate(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' })}>
                            {task.status === 'completed' ? '↺' : '✓'}
                        </button>
                        <button className="action-btn delete" onClick={() => onTaskDelete(task.id)}>×</button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderWeeklyView = () => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return (
            <div className="weekly-grid">
                <div className="weekly-header">
                    <h3>Strategic Horizon</h3>
                    <p>Aggregating behavioral patterns for the next 7 cycles.</p>
                </div>
                <div className="weekly-visualizer">
                    {days.map((day, i) => {
                        const intensity = 40 + (Math.sin(i * 0.8) * 30) + (Math.random() * 20);
                        return (
                            <div key={day} className="day-pillar">
                                <div className="pillar-track">
                                    <div className="pillar-fill" style={{ height: `${intensity}%` }}>
                                        {intensity > 60 && <span className="peak-indicator">PEAK</span>}
                                    </div>
                                </div>
                                <span className="day-name">{day}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="weekly-insights">
                    <div className="insight-card">
                        <SparklesIcon />
                        <div>
                            <h4>Cognitive Load Forecast</h4>
                            <p>High intensity predicted for Wed/Thu. Recommend shifting strategic blocks.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fluid-scheduler">
            <div className="scheduler-controls">
                <div className="view-swapper">
                    <button className={viewMode === '24h' ? 'active' : ''} onClick={() => setViewMode('24h')}>24H Focus</button>
                    <button className={viewMode === 'weekly' ? 'active' : ''} onClick={() => setViewMode('weekly')}>Weekly Horizon</button>
                </div>
                <div className="action-group">
                    <button className="add-task-btn" onClick={() => setIsAdding(true)}>+</button>
                    <button className="regenerate-btn" onClick={onRegenerate}>
                        <SparklesIcon /> Re-Sync
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="add-task-modal">
                    <div className="modal-content">
                        <h4>New Temporal Block</h4>
                        <input type="text" id="new-task-title" placeholder="Task Title" />
                        <div className="input-row">
                            <input type="time" id="new-task-time" defaultValue="09:00" />
                            <input type="number" id="new-task-duration" placeholder="Min" defaultValue="60" />
                        </div>
                        <select id="new-task-type">
                            <option value="deep-work">Deep Work</option>
                            <option value="routine">Routine</option>
                            <option value="strategic">Strategic</option>
                            <option value="rest">Rest</option>
                        </select>
                        <div className="modal-actions">
                            <button onClick={() => setIsAdding(false)}>Cancel</button>
                            <button className="confirm" onClick={() => {
                                const title = (document.getElementById('new-task-title') as HTMLInputElement).value;
                                const startTime = (document.getElementById('new-task-time') as HTMLInputElement).value;
                                const duration = parseInt((document.getElementById('new-task-duration') as HTMLInputElement).value);
                                const type = (document.getElementById('new-task-type') as HTMLSelectElement).value as any;
                                if (title) {
                                    onTaskAdd({ title, startTime, duration, type, strictness: 'fluid', status: 'pending' });
                                    setIsAdding(false);
                                }
                            }}>Add Block</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="scheduler-content">
                {viewMode === '24h' ? render24hView() : renderWeeklyView()}
            </div>
        </div>
    );
};

export default FluidScheduler;
