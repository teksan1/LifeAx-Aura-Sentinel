
import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, ArrowUpIcon } from './Icons';
import { GoogleGenAI } from '@google/genai';
import { getApiKey } from '../security';

interface TherapySessionProps {
    onComplete: (insight: string, emotionalState: string, cbtData: any) => void;
    onClose: () => void;
    userBaseline: any;
}

const TherapySession: React.FC<TherapySessionProps> = ({ onComplete, onClose, userBaseline }) => {
    const [messages, setMessages] = useState<{ role: 'user' | 'sentinel'; text: string }[]>([
        { role: 'sentinel', text: "Session Initialized. I am your Aura Sentinel, operating in Clinical Alignment mode. We will use Cognitive Behavioral strategies to identify distortions and reinforce your locus of control. How has your internal dialogue been impacting your strategic objectives today?" }
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

        try {
            const apiKey = getApiKey();
            if (!apiKey) throw new Error("API_KEY_MISSING");
            const ai = new GoogleGenAI({ apiKey });
            const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

            const history = messages.map(m => `${m.role === 'sentinel' ? 'Psychologist' : 'Patient'}: ${m.text}`).join('\n');
            
            const prompt = `You are a highly skilled clinical psychologist specializing in Cognitive Behavioral Therapy (CBT) and behavioral change. 
            Your goal is to help the user gain control and change their behavior.
            User Dossier: ${JSON.stringify(userBaseline)}
            Session History:
            ${history}
            
            New Patient Input: "${userMsg}"
            
            Respond as a professional psychologist. Use a strategy that adapts your personality to be most effective for this user (Direct, Socratic, or Empathetic based on their baseline). 
            Focus on identifying cognitive distortions and reinforcing self-efficacy. 
            Keep the response concise but clinically profound.`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            
            setMessages(prev => [...prev, { role: 'sentinel', text: responseText }]);
        } catch (e) {
            console.error("Therapy AI Error", e);
            setMessages(prev => [...prev, { role: 'sentinel', text: "I apologize, but my clinical processing unit encountered an error. Let's continue our focus on your behavioral control." }]);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const concludeSession = async () => {
        setIsAnalyzing(true);
        try {
            const apiKey = getApiKey();
            if (!apiKey) return;
            const ai = new GoogleGenAI({ apiKey });
            const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

            const history = messages.map(m => `${m.role === 'sentinel' ? 'Psychologist' : 'Patient'}: ${m.text}`).join('\n');
            const summaryPrompt = `Analyze this therapy session:
            ${history}
            
            Output ONLY a JSON object:
            {
                "insight": "One sentence core psychological insight",
                "emotionalState": "One word emotional state",
                "cbtAnalysis": {
                    "cognitiveDistortions": ["list", "of", "distortions"],
                    "behavioralHomework": "One specific task for the week"
                }
            }`;

            const result = await model.generateContent(summaryPrompt);
            const text = result.response.text();
            const jsonMatch = text.match(/\{.*\}/s);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                onComplete(data.insight, data.emotionalState, data.cbtAnalysis);
            }
        } catch (e) {
            onComplete("Session concluded with manual override.", "Stable", {});
        }
    };

    return (
        <div className="therapy-overlay">
            <div className="therapy-container">
                <div className="therapy-header">
                    <div className="header-info">
                        <SparklesIcon />
                        <h3>Clinical Alignment (CBT Mode)</h3>
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                
                <div className="therapy-chat">
                    {messages.map((m, i) => (
                        <div key={i} className={`therapy-message ${m.role}`}>
                            <div className="message-bubble">{m.text}</div>
                        </div>
                    ))}
                    {isAnalyzing && <div className="therapy-status">Sentinel is analyzing cognitive patterns...</div>}
                    <div ref={chatEndRef} />
                </div>

                <div className="therapy-footer">
                    <div className="therapy-input-wrapper">
                        <textarea 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Describe your internal state..."
                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        />
                        <button onClick={handleSend} disabled={!input.trim() || isAnalyzing}>
                            <ArrowUpIcon />
                        </button>
                    </div>
                    <button className="finish-session-btn" onClick={concludeSession} disabled={isAnalyzing}>
                        Finalize Clinical Assessment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TherapySession;
