
import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, ArrowUpIcon } from './Icons';

interface TherapySessionProps {
    onComplete: (insight: string, emotionalState: string) => void;
    onClose: () => void;
}

const TherapySession: React.FC<TherapySessionProps> = ({ onComplete, onClose }) => {
    const [messages, setMessages] = useState<{ role: 'user' | 'sentinel'; text: string }[]>([
        { role: 'sentinel', text: "Welcome to your Weekly Therapeutic Alignment. This is a space for deep reflection, beyond your tasks and goals. How are you truly feeling about your progress this week?" }
    ]);
    const [input, setInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isAnalyzing) return;
        
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsAnalyzing(true);

        // In a real scenario, this would call the Gemini API with a specific "Therapeutic" system prompt
        // For now, we simulate the Sentinel's deep empathetic response
        setTimeout(() => {
            setMessages(prev => [...prev, { 
                role: 'sentinel', 
                text: "I hear you. It sounds like there's a tension between your strategic ambitions and your current emotional capacity. Let's explore that friction point further. What's one thing you're holding onto that no longer serves your 90-day objective?" 
            }]);
            setIsAnalyzing(false);
        }, 1500);
    };

    return (
        <div className="therapy-overlay">
            <div className="therapy-container">
                <div className="therapy-header">
                    <div className="header-info">
                        <SparklesIcon />
                        <h3>Therapeutic Alignment</h3>
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                
                <div className="therapy-chat">
                    {messages.map((m, i) => (
                        <div key={i} className={`therapy-message ${m.role}`}>
                            <div className="message-bubble">{m.text}</div>
                        </div>
                    ))}
                    {isAnalyzing && <div className="therapy-status">Sentinel is reflecting...</div>}
                    <div ref={chatEndRef} />
                </div>

                <div className="therapy-footer">
                    <div className="therapy-input-wrapper">
                        <textarea 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Speak your truth..."
                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        />
                        <button onClick={handleSend} disabled={!input.trim() || isAnalyzing}>
                            <ArrowUpIcon />
                        </button>
                    </div>
                    <button className="finish-session-btn" onClick={() => onComplete("Deep focus achieved through emotional regulation.", "Balanced")}>
                        Conclude Alignment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TherapySession;
