
import React from 'react';
import { StrategicMetric, AuditLog } from '../types';
import { SparklesIcon, GridIcon, ArrowUpIcon } from './Icons';

interface EnterpriseDashboardProps {
    metrics: StrategicMetric[];
    auditLogs: AuditLog[];
    onNavigate: (view: any) => void;
}

const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({ metrics, auditLogs, onNavigate }) => {
    return (
        <div className="enterprise-dashboard scroll-content">
            <div className="dashboard-header">
                <div className="brand-section">
                    <span className="badge">ENTERPRISE CORE</span>
                    <h1>Strategic Command Center</h1>
                </div>
                <div className="system-status">
                    <div className="status-dot pulse"></div>
                    <span>Sentinel Active</span>
                </div>
            </div>

            <div className="metrics-grid">
                {metrics.map((metric, i) => (
                    <div key={i} className={`metric-card ${metric.status}`}>
                        <div className="metric-label">{metric.label}</div>
                        <div className="metric-value">
                            {metric.value}%
                            <span className={`trend ${metric.trend >= 0 ? 'up' : 'down'}`}>
                                {metric.trend >= 0 ? '↑' : '↓'} {Math.abs(metric.trend)}%
                            </span>
                        </div>
                        <div className="metric-bar">
                            <div className="bar-fill" style={{ width: `${metric.value}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-main-grid">
                <div className="main-actions">
                    <h2>Operational Modules</h2>
                    <div className="action-tiles">
                        <div className="action-tile" onClick={() => onNavigate('chat')}>
                            <SparklesIcon />
                            <span>Intelligence</span>
                        </div>
                        <div className="action-tile" onClick={() => onNavigate('scheduler')}>
                            <GridIcon />
                            <span>Temporal Map</span>
                        </div>
                        <div className="action-tile" onClick={() => onNavigate('finance')}>
                            <ArrowUpIcon />
                            <span>Financial Core</span>
                        </div>
                        <div className="action-tile" onClick={() => onNavigate('therapy')}>
                            <SparklesIcon />
                            <span>Clinical Alignment</span>
                        </div>
                    </div>
                </div>

                <div className="audit-section">
                    <div className="section-header">
                        <h2>System Audit Log</h2>
                        <span className="log-count">{auditLogs.length} Events</span>
                    </div>
                    <div className="log-list">
                        {auditLogs.slice(0, 10).map(log => (
                            <div key={log.id} className={`log-item ${log.severity}`}>
                                <span className="log-time">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                <span className="log-category">[{log.category.toUpperCase()}]</span>
                                <span className="log-action">{log.action}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnterpriseDashboard;
