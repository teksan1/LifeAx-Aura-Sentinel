
import React, { useState } from 'react';
import { FinancialAccount, Budget } from '../types';
import { ArrowUpIcon, GridIcon } from './Icons';

interface FinancialCoreProps {
    accounts: FinancialAccount[];
    budgets: Budget[];
    onUpdateBudget: (category: string, amount: number) => void;
    onAddAccount: (account: FinancialAccount) => void;
}

const FinancialCore: React.FC<FinancialCoreProps> = ({ accounts, budgets, onUpdateBudget, onAddAccount }) => {
    const [isConnecting, setIsConnecting] = useState(false);

    const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

    return (
        <div className="financial-core scroll-content">
            <div className="financial-header">
                <h1>Sovereign Financial Core</h1>
                <div className="total-liquidity">
                    <label>Total Liquidity</label>
                    <div className="amount">${totalBalance.toLocaleString()}</div>
                </div>
            </div>

            <div className="accounts-grid">
                {accounts.map(acc => (
                    <div key={acc.id} className="account-card">
                        <div className="acc-info">
                            <span className="acc-name">{acc.name}</span>
                            <span className="acc-type">{acc.type.toUpperCase()}</span>
                        </div>
                        <div className="acc-balance">${acc.balance.toLocaleString()}</div>
                    </div>
                ))}
                <button className="add-account-btn" onClick={() => setIsConnecting(true)}>
                    {isConnecting ? "Initializing Secure Link..." : "+ Link Bank Account"}
                </button>
            </div>

            <div className="budgets-section">
                <h2>Enforcement Budgets</h2>
                <div className="budgets-list">
                    {budgets.map(budget => {
                        const percent = (budget.spent / budget.limit) * 100;
                        const isOver = percent > 100;
                        return (
                            <div key={budget.category} className={`budget-item ${isOver ? 'over-limit' : ''}`}>
                                <div className="budget-info">
                                    <span className="category">{budget.category}</span>
                                    <span className="enforcement">{budget.enforcementLevel.toUpperCase()}</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                                </div>
                                <div className="budget-meta">
                                    <span>${budget.spent} / ${budget.limit}</span>
                                    <span>{percent.toFixed(1)}%</span>
                                </div>
                                {isOver && budget.enforcementLevel === 'lockdown' && (
                                    <div className="lockdown-warning">ENFORCEMENT ACTIVE: Strategic blocks restricted.</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FinancialCore;
