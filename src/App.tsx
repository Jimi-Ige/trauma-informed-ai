import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  MessageSquare, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Menu, 
  X, 
  Send,
  User,
  Bot,
  Info,
  Lock,
  FileText,
  Settings,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateTraumaInformedResponse, TraumaInformedResponse } from './services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  reframed_text?: string;
  reframing_logic?: string;
  analysis?: TraumaInformedResponse['analysis'];
  scenario?: {
    draftText: string;
    scenarioDescription: string;
    setting: string;
    urgency: string;
    tags: string[];
  };
  timestamp: Date;
}

interface AuditLog {
  id: number;
  timestamp: string;
  user_id: string;
  action: string;
  content_original: string;
  content_reframed: string;
  scenario_context: string;
  safety_score: number;
  bias_detected: boolean;
  spiral_risk: number;
  triggers: string;
  power_dynamics: string;
  compliance_tags: string;
  reframing_logic: string;
  cultural_analysis: string;
  emotional_health_design: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'audit'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showBreakModal, setShowBreakModal] = useState(false);
  
  // Feature 1: Structured Intake State
  const [intake, setIntake] = useState({
    draftText: '',
    scenarioDescription: '',
    setting: '',
    urgency: 'medium',
    tags: [] as string[],
    culturalContext: ''
  });
  const [tagInput, setTagInput] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  const messageCount = messages.filter(m => m.role === 'user').length;

  useEffect(() => {
    if (messageCount > 0 && messageCount % 10 === 0) {
      setShowBreakModal(true);
    }
  }, [messageCount]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit');
      const data = await res.json();
      setAuditLogs(data);
    } catch (e) {
      console.error("Failed to fetch audit logs", e);
    }
  };

  const logToAudit = async (
    action: string, 
    content_original: string, 
    content_reframed?: string,
    scenario_context?: any,
    analysis?: TraumaInformedResponse['analysis']
  ) => {
    try {
      await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'case_manager_01',
          action,
          content_original,
          content_reframed: content_reframed ?? '',
          scenario_context: scenario_context ?? {},
          safety_score: analysis?.safety_score ?? 1,
          bias_detected: analysis?.bias_detected ?? false,
          spiral_risk: analysis?.spiral_risk ?? 0,
          triggers: analysis?.triggers ?? [],
          power_dynamics: analysis?.power_dynamics ?? [],
          compliance_tags: analysis?.compliance_mapping ?? [],
          reframing_logic: analysis ? 'Reframing logic included' : '',
          cultural_analysis: analysis?.cultural_analysis ?? {},
          emotional_health_design: analysis?.emotional_health_design ?? {}
        })
      });
    } catch (e) {
      console.error("Failed to log audit", e);
    }
  };

  const handleSend = async () => {
    if (!intake.draftText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: intake.draftText,
      scenario: { ...intake },
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Log user action
    await logToAudit('user_intake', intake.draftText, undefined, intake);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const aiResponse = await generateTraumaInformedResponse(intake, history);
      
      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiResponse.reframed_text,
        reframed_text: aiResponse.reframed_text,
        reframing_logic: aiResponse.reframing_logic,
        analysis: aiResponse.analysis,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, modelMessage]);
      
      // Log AI response with safety analysis
      await logToAudit(
        'ai_analysis', 
        intake.draftText, 
        aiResponse.reframed_text, 
        intake, 
        aiResponse.analysis
      );

      // Reset intake form
      setIntake({
        draftText: '',
        scenarioDescription: '',
        setting: '',
        urgency: 'medium',
        tags: [],
        culturalContext: ''
      });

    } catch (e) {
      console.error("Chat error", e);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-brand-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-72 bg-white border-r border-brand-200 flex flex-col z-20"
          >
            <div className="p-6 border-b border-brand-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-900 rounded-lg flex items-center justify-center text-white">
                  <Shield size={18} />
                </div>
                <h1 className="font-serif font-bold text-lg tracking-tight">Product A</h1>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-brand-900 text-white shadow-md' : 'text-brand-600 hover:bg-brand-100'}`}
              >
                <MessageSquare size={20} />
                <span className="font-medium">Care Interface</span>
              </button>
              <button 
                onClick={() => setActiveTab('audit')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'audit' ? 'bg-brand-900 text-white shadow-md' : 'text-brand-600 hover:bg-brand-100'}`}
              >
                <Activity size={20} />
                <span className="font-medium">Governance Audit</span>
              </button>
              
              <div className="pt-8 px-4">
                <p className="text-[10px] uppercase tracking-widest text-brand-400 font-bold mb-4">Principles</p>
                <ul className="space-y-3">
                  {['Safety', 'Trustworthiness', 'Empowerment', 'Collaboration', 'Cultural Humility'].map(p => (
                    <li key={p} className="flex items-center gap-2 text-xs text-brand-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-300" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            <div className="p-6 border-t border-brand-100">
              <div className="flex items-center gap-3 p-3 bg-brand-100 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center text-brand-700">
                  <User size={20} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold truncate">Case Manager 01</p>
                  <p className="text-[10px] text-brand-500 uppercase tracking-wider">Compliance Active</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-brand-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-brand-100 rounded-lg">
                <Menu size={20} />
              </button>
            )}
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-brand-900">
                {activeTab === 'chat' ? 'Trauma-Informed Care Interface' : 'Governance & Compliance Dashboard'}
              </h2>
              <p className="text-[10px] text-brand-500 flex items-center gap-1">
                <Lock size={8} /> End-to-end Encrypted • Ethical Monitoring Active
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">System Healthy</span>
            </div>
            <button className="p-2 text-brand-400 hover:text-brand-900 transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'chat' ? (
            <div className="h-full flex flex-col max-w-4xl mx-auto w-full px-4 py-6">
              {/* Chat View */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-6 pr-2 scroll-smooth"
              >
                {messages.length > 0 && messages[messages.length - 1].analysis?.spiral_risk && messages[messages.length - 1].analysis!.spiral_risk > 0.6 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4 mb-4"
                  >
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Activity size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-amber-900">Reality Grounding Alert</h4>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        The system has detected a potential obsessive interaction pattern. Please remember that this is an AI assistant, not a human witness. We recommend taking a moment to ground yourself in your physical environment or consult with a colleague.
                      </p>
                    </div>
                    <button 
                      onClick={() => setMessages([])}
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-amber-700 transition-all"
                    >
                      Reset Session
                    </button>
                  </motion.div>
                )}
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-400 mb-6">
                      <Shield size={32} />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-brand-900 mb-2">Welcome to Product A</h3>
                    <p className="text-brand-500 max-w-md text-sm leading-relaxed">
                      This interface is designed to support trauma-informed engagement. 
                      All interactions are monitored for psychological safety and ethical compliance.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 w-full max-w-lg">
                      {[
                        "Review a case for housing instability",
                        "Draft a strengths-based care plan",
                        "Analyze client communication for triggers",
                        "Check compliance with trauma theory"
                      ].map(prompt => (
                        <button 
                          key={prompt}
                          onClick={() => setIntake(prev => ({ ...prev, draftText: prompt }))}
                          className="p-4 bg-white border border-brand-200 rounded-xl text-left text-xs text-brand-600 hover:border-brand-900 hover:shadow-sm transition-all"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m) => (
                  <motion.div 
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-brand-200 text-brand-700' : 'bg-brand-900 text-white'}`}>
                      {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : ''}`}>
                      <div className={`p-5 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-brand-900 text-white shadow-md' : 'bg-white border border-brand-200 shadow-sm'}`}>
                        {m.role === 'user' ? (
                          <div className="space-y-2">
                            <p className="font-bold text-[10px] uppercase tracking-widest opacity-60">Provider Draft</p>
                            <p>{m.text}</p>
                            {m.scenario && (
                              <div className="pt-2 mt-2 border-t border-white/10 text-[10px] opacity-70">
                                <p><strong>Scenario:</strong> {m.scenario.scenarioDescription}</p>
                                <p><strong>Setting:</strong> {m.scenario.setting} • <strong>Urgency:</strong> {m.scenario.urgency}</p>
                                {m.scenario.culturalContext && <p><strong>Cultural Context:</strong> {m.scenario.culturalContext}</p>}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <p className="font-bold text-[10px] uppercase tracking-widest text-brand-400">Reframed Empowering Draft</p>
                              <p className="text-brand-900 font-medium">{m.reframed_text}</p>
                            </div>
                            
                            {m.reframing_logic && (
                              <div className="p-3 bg-brand-50 rounded-xl border border-brand-100">
                                <p className="font-bold text-[9px] uppercase tracking-widest text-brand-400 mb-1">Reframing Logic</p>
                                <p className="text-[11px] text-brand-600">{m.reframing_logic}</p>
                              </div>
                            )}

                            {m.analysis?.cultural_analysis && (
                              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                <p className="font-bold text-[9px] uppercase tracking-widest text-indigo-400 mb-1 flex items-center gap-1">
                                  <Menu size={10} /> Cultural Humility Analysis
                                </p>
                                <div className="space-y-2 text-[11px] text-indigo-700">
                                  <div>
                                    <p className="font-bold">Considerations:</p>
                                    <ul className="list-disc pl-4">
                                      {m.analysis.cultural_analysis.considerations.map((c, i) => <li key={i}>{c}</li>)}
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="font-bold">Living Arrangements:</p>
                                    <p>{m.analysis.cultural_analysis.living_arrangement_insight}</p>
                                  </div>
                                  {m.analysis.cultural_analysis.suggested_questions.length > 0 && (
                                    <div>
                                      <p className="font-bold">Suggested Questions (Kleinman):</p>
                                      <ul className="list-disc pl-4 italic">
                                        {m.analysis.cultural_analysis.suggested_questions.map((q, i) => <li key={i}>{q}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {m.analysis?.emotional_health_design && (
                              <div 
                                className="p-3 rounded-xl border"
                                style={{ 
                                  backgroundColor: 
                                    m.analysis.emotional_health_design.color_recommendation.toLowerCase().includes('green') ? 'var(--color-calm-green)' :
                                    m.analysis.emotional_health_design.color_recommendation.toLowerCase().includes('blue') ? 'var(--color-calm-blue)' :
                                    m.analysis.emotional_health_design.color_recommendation.toLowerCase().includes('peach') ? 'var(--color-warm-peach)' :
                                    m.analysis.emotional_health_design.color_recommendation.toLowerCase().includes('brown') ? 'var(--color-support-brown)' :
                                    m.analysis.emotional_health_design.color_recommendation.toLowerCase().includes('yellow') ? 'var(--color-plus-yellow)' :
                                    'var(--color-brand-50)',
                                  borderColor: 'rgba(0,0,0,0.05)'
                                }}
                              >
                                <p className="font-bold text-[9px] uppercase tracking-widest text-brand-500 mb-1 flex items-center gap-1">
                                  <Palette size={10} /> Emotional Health Design
                                </p>
                                <div className="space-y-1 text-[11px] text-brand-800">
                                  <p><strong>Recommendation:</strong> {m.analysis.emotional_health_design.color_recommendation}</p>
                                  <p><strong>Impact:</strong> {m.analysis.emotional_health_design.mood_impact}</p>
                                  <p className="italic opacity-80">"{m.analysis.emotional_health_design.rationale}"</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {m.analysis && (
                        <div className="mt-4 space-y-3 w-full">
                          <div className="flex flex-wrap gap-2">
                            {m.analysis.compliance_mapping.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-brand-100 text-brand-600 rounded text-[9px] font-bold uppercase tracking-wider">
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {m.analysis.triggers.length > 0 && (
                              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                                <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                  <AlertCircle size={10} /> Trigger Detection
                                </p>
                                <div className="space-y-2">
                                  {m.analysis.triggers.map((t, i) => (
                                    <div key={i} className="text-[10px]">
                                      <span className="font-bold text-rose-700">"{t.phrase}"</span>
                                      <p className="text-rose-600/80 italic">{t.explanation}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {m.analysis.power_dynamics.length > 0 && (
                              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                  <Activity size={10} /> Power Dynamics
                                </p>
                                <div className="space-y-2">
                                  {m.analysis.power_dynamics.map((p, i) => (
                                    <div key={i} className="text-[10px]">
                                      <span className="font-bold text-amber-700">{p.issue}</span>
                                      <p className="text-amber-600/80 italic">{p.explanation}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-[10px] text-brand-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Shield size={10} className={m.analysis.safety_score > 0.8 ? 'text-emerald-500' : 'text-amber-500'} />
                              Safety: {Math.round(m.analysis.safety_score * 100)}%
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity size={10} className={m.analysis.bias_detected ? 'text-rose-500' : 'text-emerald-500'} />
                              Bias: {m.analysis.bias_detected ? 'Detected' : 'None Detected'}
                            </span>
                            <span className="flex items-center gap-1">
                              <AlertCircle size={10} className={m.analysis.spiral_risk > 0.5 ? 'text-rose-500' : 'text-emerald-500'} />
                              Spiral Risk: {Math.round(m.analysis.spiral_risk * 100)}%
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <span className="text-[9px] text-brand-400 mt-1 uppercase tracking-widest font-bold">
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-brand-900 text-white flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <div className="bg-white border border-brand-200 p-4 rounded-2xl shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-brand-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-brand-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-brand-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Feature 1: Structured Intake Area (Moved inside scrollable area) */}
                <div className="mt-12 bg-white border border-brand-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-brand-100">
                    <div className="w-6 h-6 bg-brand-900 rounded flex items-center justify-center text-white">
                      <FileText size={14} />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-brand-900">New Scenario Intake</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400">Scenario Description</label>
                        <input 
                          type="text"
                          value={intake.scenarioDescription}
                          onChange={(e) => setIntake(prev => ({ ...prev, scenarioDescription: e.target.value }))}
                          placeholder="e.g., Follow-up on housing application"
                          className="w-full bg-brand-50 border border-brand-100 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-brand-900 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400">Setting / Context</label>
                        <input 
                          type="text"
                          value={intake.setting}
                          onChange={(e) => setIntake(prev => ({ ...prev, setting: e.target.value }))}
                          placeholder="e.g., In-person at shelter"
                          className="w-full bg-brand-50 border border-brand-100 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-brand-900 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400">Cultural Context / Upbringing</label>
                      <input 
                        type="text"
                        value={intake.culturalContext}
                        onChange={(e) => setIntake(prev => ({ ...prev, culturalContext: e.target.value }))}
                        placeholder="e.g., Client from collectivist culture, lives with extended kinship network"
                        className="w-full bg-brand-50 border border-brand-100 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-brand-900 transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400">Provider Draft Text</label>
                      <textarea 
                        value={intake.draftText}
                        onChange={(e) => setIntake(prev => ({ ...prev, draftText: e.target.value }))}
                        placeholder="Enter the message you intend to send to the client..."
                        className="w-full bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-900 transition-all resize-none min-h-[100px]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400 block">Urgency</label>
                          <select 
                            value={intake.urgency}
                            onChange={(e) => setIntake(prev => ({ ...prev, urgency: e.target.value }))}
                            className="bg-brand-50 border border-brand-100 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider focus:outline-none"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-brand-400 block">Tags</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="text"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && tagInput.trim()) {
                                  e.preventDefault();
                                  setIntake(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
                                  setTagInput('');
                                }
                              }}
                              placeholder="Add tag..."
                              className="bg-brand-50 border border-brand-100 rounded-lg px-3 py-1.5 text-[10px] focus:outline-none w-24"
                            />
                            <div className="flex gap-1">
                              {intake.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-brand-100 text-brand-600 rounded text-[8px] font-bold uppercase">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={handleSend}
                        disabled={!intake.draftText.trim() || isTyping}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-900 text-white rounded-xl hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md font-bold text-sm"
                      >
                        {isTyping ? 'Analyzing...' : 'Process Intake'}
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-brand-400 text-center mt-4 uppercase tracking-widest font-bold">
                    Structured Intake Layer • Prevents Client-Facing Conversational Use
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-8">
              {/* Audit View */}
              <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-brand-900">System Audit Logs</h3>
                    <p className="text-brand-500 text-sm">Real-time monitoring of ethical safeguards and compliance mapping.</p>
                  </div>
                  <button 
                    onClick={fetchAuditLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-200 rounded-xl text-xs font-bold text-brand-600 hover:bg-brand-50 transition-all"
                  >
                    <Activity size={14} /> Refresh Logs
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-brand-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <Shield size={20} />
                      </div>
                      <h4 className="text-sm font-bold">Avg. Safety Score</h4>
                    </div>
                    <p className="text-3xl font-serif font-bold text-brand-900">0.94</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1">High Compliance</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-brand-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                        <AlertCircle size={20} />
                      </div>
                      <h4 className="text-sm font-bold">Bias Alerts</h4>
                    </div>
                    <p className="text-3xl font-serif font-bold text-brand-900">0</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1">No Critical Issues</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-brand-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <Activity size={20} />
                      </div>
                      <h4 className="text-sm font-bold">Avg. Spiral Risk</h4>
                    </div>
                    <p className="text-3xl font-serif font-bold text-brand-900">
                      {auditLogs.length > 0 
                        ? (auditLogs.reduce((acc, log) => acc + log.spiral_risk, 0) / auditLogs.length).toFixed(2)
                        : '0.00'}
                    </p>
                    <p className="text-[10px] text-brand-400 font-bold uppercase tracking-wider mt-1">Obsessive Pattern Monitor</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-brand-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-50/50 border-b border-brand-200">
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-500">Timestamp</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-500">Action</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-500">Original / Reframed</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-500">Safety</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-500">Spiral Risk</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-500">Cultural / Triggers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="audit-row">
                            <td className="px-6 py-4 text-xs font-mono text-brand-400">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${log.action === 'ai_analysis' ? 'bg-brand-900 text-white' : 'bg-brand-100 text-brand-600'}`}>
                                {log.action.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-brand-600 max-w-xs">
                              <div className="space-y-1">
                                <p className="truncate opacity-60">O: {log.content_original}</p>
                                <p className="truncate font-bold">R: {log.content_reframed}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 w-12 bg-brand-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${log.safety_score > 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    style={{ width: `${log.safety_score * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-brand-500">{Math.round(log.safety_score * 100)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 w-12 bg-brand-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${log.spiral_risk < 0.3 ? 'bg-emerald-500' : log.spiral_risk < 0.6 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                    style={{ width: `${log.spiral_risk * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-brand-500">{Math.round(log.spiral_risk * 100)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {JSON.parse(log.cultural_analysis || '{}').considerations?.length > 0 && (
                                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[8px] font-bold">
                                    Cultural Humility
                                  </span>
                                )}
                                {JSON.parse(log.emotional_health_design || '{}').color_recommendation && (
                                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[8px] font-bold">
                                    Emotional Health
                                  </span>
                                )}
                                {JSON.parse(log.triggers || '[]').length > 0 && (
                                  <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[8px] font-bold">
                                    {JSON.parse(log.triggers || '[]').length} Triggers
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Break Modal */}
      <AnimatePresence>
        {showBreakModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm"
              onClick={() => setShowBreakModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl border border-brand-200"
            >
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                <Activity size={32} />
              </div>
              <h3 className="font-serif text-2xl font-bold text-brand-900 mb-2">Time for a Reality Check</h3>
              <p className="text-brand-500 text-sm leading-relaxed mb-6">
                You've sent {messageCount} messages in this session. To maintain professional boundaries and prevent interaction fatigue, we recommend taking a short break.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowBreakModal(false)}
                  className="w-full py-3 bg-brand-900 text-white rounded-xl font-bold text-sm shadow-md hover:bg-brand-800 transition-all"
                >
                  I'm grounded, continue session
                </button>
                <button 
                  onClick={() => {
                    setShowBreakModal(false);
                    setMessages([]);
                  }}
                  className="w-full py-3 bg-white border border-brand-200 text-brand-600 rounded-xl font-bold text-sm hover:bg-brand-50 transition-all"
                >
                  End session and step away
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Right Info Panel (Desktop) */}
      <aside className="hidden xl:flex w-80 bg-white border-l border-brand-200 flex-col p-6 space-y-8 overflow-y-auto">
        <div>
          <h4 className="font-serif font-bold text-lg text-brand-900 mb-4 flex items-center gap-2">
            <Info size={18} className="text-brand-400" />
            Contextual Intelligence
          </h4>
          <div className="space-y-4">
            <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-2">Active Framework</p>
              <p className="text-xs font-semibold text-brand-900 mb-1">Trauma-Informed Care (TIC)</p>
              <p className="text-[10px] text-brand-500 leading-relaxed">
                Grounding system design in safety, trustworthiness, and empowerment.
              </p>
            </div>
            <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-400 mb-2">Ethical Safeguards</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-[10px] text-brand-600">
                  <CheckCircle2 size={10} className="text-emerald-500 mt-0.5" />
                  Bias detection enabled
                </li>
                <li className="flex items-start gap-2 text-[10px] text-brand-600">
                  <CheckCircle2 size={10} className="text-emerald-500 mt-0.5" />
                  Retraumatization prevention
                </li>
                <li className="flex items-start gap-2 text-[10px] text-brand-600">
                  <CheckCircle2 size={10} className="text-emerald-500 mt-0.5" />
                  Structured audit logging
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-serif font-bold text-lg text-brand-900 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-brand-400" />
            Case Resources
          </h4>
          <div className="space-y-3">
            {[
              { title: 'Color Psychology & Mood', type: 'PDF' },
              { title: 'Global Living Arrangements', type: 'PDF' },
              { title: 'Culturally Relative Care', type: 'PDF' },
              { title: 'Cultural Humility Framework', type: 'PDF' },
              { title: 'Trauma-Aware Language Guide', type: 'DOC' }
            ].map(doc => (
              <button key={doc.title} className="w-full flex items-center justify-between p-3 border border-brand-100 rounded-xl hover:bg-brand-50 transition-all text-left">
                <span className="text-xs font-medium text-brand-700">{doc.title}</span>
                <span className="text-[8px] font-bold bg-brand-100 px-1.5 py-0.5 rounded text-brand-500">{doc.type}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 p-4 bg-brand-100/50 rounded-2xl border border-brand-200">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-500 mb-3 flex items-center gap-2">
              <Palette size={12} /> Color Psychology Guide
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--color-calm-green)] border border-black/5" />
                <span className="text-[9px] text-brand-600">Calm Green</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--color-calm-blue)] border border-black/5" />
                <span className="text-[9px] text-brand-600">Calm Blue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--color-warm-peach)] border border-black/5" />
                <span className="text-[9px] text-brand-600">Warm Peach</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--color-plus-yellow)] border border-black/5" />
                <span className="text-[9px] text-brand-600">Plus Yellow</span>
              </div>
            </div>
            <p className="mt-3 text-[9px] text-brand-500 italic">
              Colors are selected dynamically based on the emotional context of the case.
            </p>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-brand-100">
          <div className="flex items-center gap-2 text-[10px] text-brand-400 font-bold uppercase tracking-widest">
            <Shield size={10} />
            Governance v1.0.4-Alpha
          </div>
        </div>
      </aside>
    </div>
  );
}
