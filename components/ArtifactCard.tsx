
import React from 'react';
import { WeeklyReport } from '../types';
import { SparklesIcon } from './Icons';

interface ArtifactCardProps {
    report: WeeklyReport;
    onClose: () => void;
}

const ArtifactCard: React.FC<ArtifactCardProps> = ({ report, onClose }) => {
    return (
        <div className="artifact-overlay">
            <div className="artifact-card">
                <div className="artifact-header">
                    <SparklesIcon />
                    <h3>Strategic Intelligence Report</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="artifact-body">
                    <div className="artifact-section">
                        <label>Week Starting</label>
                        <p>{report.weekStarting}</p>
                    </div>
                    <div className="artifact-section">
                        <label>Efficiency Score</label>
                        <div className="score-bar">
                            <div className="score-fill" style={{ width: `${report.efficiencyScore}%` }}></div>
                        </div>
                        <p>{report.efficiencyScore}% Optimization</p>
                    </div>
                    <div className="artifact-section">
                        <label>Behavioral Summary</label>
                        <p>{report.summary}</p>
                    </div>
                    <div className="artifact-section highlight">
                        <label>Strategic Pivot Recommendation</label>
                        <p>{report.pivotRecommendation}</p>
                    </div>
                </div>
                <div className="artifact-footer">
                    <p>Aura Sentinel • Behavioral Intelligence Unit</p>
                </div>
            </div>
        </div>
    );
};

export default ArtifactCard;
