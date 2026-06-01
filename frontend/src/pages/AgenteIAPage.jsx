import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2 } from 'lucide-react';
import api from '../api/client';
import { useErrorModal } from '../context/ErrorModalContext';
import ReactMarkdown from 'react-markdown';

export default function AgenteIAPage() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: '¡Hola! Soy tu agente virtual de NeonBench. Puedo analizar tu historial de entrenamiento, sugerir rutinas y detectar estancamientos o progresos. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { showError } = useErrorModal();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userMessage });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.reply }]);
    } catch (err) {
      console.error(err);
      showError(
        err.serverMessage || 'No se pudo contactar al Agente IA. Revisa tu conexión o la API Key.',
        'Error de Conexión IA'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-h-[800px] animate-fade-in p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#42ffe0]/20">
        <div className="relative">
          <div className="absolute inset-0 bg-[#42ffe0]/30 rounded-full blur-[10px] pointer-events-none"></div>
          <Bot size={32} className="text-[#42ffe0] relative z-10" />
        </div>
        <div>
          <h1 className="font-mono font-black text-2xl text-[#42ffe0] text-glow-cyan">NeonTrainer AI</h1>
          <p className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">Análisis de Datos en Tiempo Real</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto glass-card rounded-2xl border border-[#42ffe0]/30 p-4 mb-4 flex flex-col gap-4 shadow-[0_0_20px_#42ffe011]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
              msg.role === 'user' 
                ? 'bg-[#bf5af2]/20 border border-[#bf5af2] text-[#bf5af2]' 
                : 'bg-[#42ffe0]/20 border border-[#42ffe0] text-[#42ffe0]'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`p-3 rounded-2xl text-sm font-sans ${
              msg.role === 'user'
                ? 'bg-[#bf5af2]/10 border border-[#bf5af2]/30 text-white rounded-tr-none'
                : 'bg-[#050505] border border-[#42ffe0]/30 text-neutral-200 rounded-tl-none shadow-[0_0_15px_#42ffe015]'
            }`}>
              {msg.role === 'ai' ? (
                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-neutral-800">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#42ffe0]/20 border border-[#42ffe0] text-[#42ffe0]">
              <Bot size={16} />
            </div>
            <div className="p-3 rounded-2xl text-sm font-mono bg-[#050505] border border-[#42ffe0]/30 text-[#42ffe0] rounded-tl-none flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Procesando datos...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregúntame sobre tus récords, estancamientos o volúmenes..."
          disabled={isLoading}
          className="flex-1 bg-[#050505] text-white font-sans text-sm border border-[#42ffe0]/30 rounded-xl px-4 py-3 outline-none focus:border-[#42ffe0] focus:ring-1 focus:ring-[#42ffe0]/30 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-[#42ffe0]/10 text-[#42ffe0] border border-[#42ffe0] hover:bg-[#42ffe0]/20 transition-all px-4 py-3 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_#42ffe033]"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
