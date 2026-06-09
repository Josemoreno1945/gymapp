import { useState, useRef, useEffect } from 'react';
import { BrainCircuit, Send, User, Loader2, Zap, TrendingDown, Clock, Flame, ChevronRight, History, AlertTriangle, CheckCircle, XCircle, MessageSquare, RefreshCw } from 'lucide-react';
import api from '../api/client';
import { useErrorModal } from '../context/ErrorModalContext';
import ReactMarkdown from 'react-markdown';

// ─── Quick Action Buttons config ─────────────────────────────
const QUICK_ACTIONS = [
  {
    id: 'churn',
    icon: TrendingDown,
    label: 'Riesgo de Abandono',
    emoji: '📊',
    color: 'pink',
    prompt: 'Analiza el riesgo de abandono (churn) actual de los clientes. ¿Quiénes están en riesgo? ¿Cuál es la tasa de retención? Dame recomendaciones concretas.',
    endpoint: '/ai/retention',
  },
  {
    id: 'peak-hours',
    icon: Clock,
    label: 'Horas Pico',
    emoji: '🕒',
    color: 'cyan',
    prompt: 'Analiza las horas pico de uso de la plataforma. ¿Cuándo hay más actividad? ¿Qué franjas horarias debo optimizar para marketing o mantenimiento de servidores?',
    endpoint: '/ai/peak-hours',
  },
  {
    id: 'engagement',
    icon: Flame,
    label: 'Índice de Enganche',
    emoji: '🔥',
    color: 'purple',
    prompt: 'Calcula el índice de engagement global de todos mis clientes. ¿Quiénes tienen mayor compromiso? ¿Dónde debo invertir tiempo de desarrollo? Dame el ranking.',
    endpoint: '/ai/engagement',
  },
];

const COLOR_MAP = {
  pink:   { text: 'text-[#ff2d78]', bg: 'bg-[#ff2d78]/10', border: 'border-[#ff2d78]/40', shadow: 'shadow-[0_0_10px_#ff2d7822]', hoverBg: 'hover:bg-[#ff2d78]/15' },
  cyan:   { text: 'text-[#42ffe0]', bg: 'bg-[#42ffe0]/10', border: 'border-[#42ffe0]/40', shadow: 'shadow-[0_0_10px_#42ffe022]', hoverBg: 'hover:bg-[#42ffe0]/15' },
  purple: { text: 'text-[#bf5af2]', bg: 'bg-[#bf5af2]/10', border: 'border-[#bf5af2]/40', shadow: 'shadow-[0_0_10px_#bf5af222]', hoverBg: 'hover:bg-[#bf5af2]/15' },
};

// ─── Metric Result Panel ──────────────────────────────────────
function MetricPanel({ data, type }) {
  if (!data) return null;

  if (type === 'churn') {
    const r = data.resumen || {};
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 animate-fade-in">
        {[
          { label: 'Total', value: r.total_usuarios, color: 'text-white' },
          { label: 'Activos', value: r.activos, color: 'text-[#00ff66]' },
          { label: 'En Riesgo', value: r.en_riesgo, color: 'text-[#42ffe0]' },
          { label: 'Abandonados', value: r.abandonados, color: 'text-[#ff2d78]' },
          { label: 'Retención', value: `${r.tasa_retencion_pct}%`, color: 'text-[#00ff66]' },
          { label: 'Churn', value: `${r.tasa_churn_pct}%`, color: 'text-[#ff2d78]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#080808] rounded-xl p-3 border border-neutral-900 flex flex-col gap-1">
            <span className="font-mono text-[9px] text-neutral-600 uppercase tracking-widest">{label}</span>
            <span className={`font-mono text-xl font-black ${color}`}>{value ?? '—'}</span>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'peak-hours') {
    const p = data.hora_pico || {};
    const franjas = data.franjas || {};
    return (
      <div className="grid grid-cols-2 gap-3 mt-3 animate-fade-in">
        {[
          { label: 'Hora Pico', value: `${p.hora ?? '?'}:00`, sub: `${p.pct_del_total ?? 0}% del uso`, color: 'text-[#42ffe0]' },
          { label: 'Madrugada 0-6h', value: franjas.madrugada_0_6 ?? 0, sub: 'registros', color: 'text-neutral-400' },
          { label: 'Mañana 6-12h', value: franjas.manana_6_12 ?? 0, sub: 'registros', color: 'text-[#42ffe0]' },
          { label: 'Tarde 12-18h', value: franjas.tarde_12_18 ?? 0, sub: 'registros', color: 'text-[#42ffe0]' },
          { label: 'Noche 18-24h', value: franjas.noche_18_24 ?? 0, sub: 'registros', color: 'text-[#bf5af2]' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-[#080808] rounded-xl p-3 border border-neutral-900 flex flex-col gap-1">
            <span className="font-mono text-[9px] text-neutral-600 uppercase tracking-widest">{label}</span>
            <span className={`font-mono text-xl font-black ${color}`}>{value}</span>
            {sub && <span className="font-mono text-[10px] text-neutral-700">{sub}</span>}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'engagement') {
    const g = data.engagement_grupal || {};
    const dist = data.distribucion || {};
    return (
      <div className="grid grid-cols-2 gap-3 mt-3 animate-fade-in">
        <div className="bg-[#080808] rounded-xl p-4 border border-[#bf5af2]/20 flex flex-col items-center justify-center col-span-2 md:col-span-1">
          <span className="font-mono text-[9px] text-neutral-600 uppercase tracking-widest mb-1">Score Grupal</span>
          <span className="font-mono text-5xl font-black text-[#bf5af2] drop-shadow-[0_0_10px_#bf5af2]">{g.score_promedio ?? 0}</span>
          <span className="font-mono text-xs text-[#bf5af2] uppercase mt-1">{g.clasificacion ?? '—'}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Excepcional', value: dist.excepcional_80_100 ?? 0, color: 'text-[#00ff66]' },
            { label: 'Alto', value: dist.alto_60_80 ?? 0, color: 'text-[#42ffe0]' },
            { label: 'Medio', value: dist.medio_40_60 ?? 0, color: 'text-neutral-300' },
            { label: 'Bajo', value: dist.bajo_0_40 ?? 0, color: 'text-[#ff2d78]' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#080808] rounded-xl p-3 border border-neutral-900 flex flex-col gap-1">
              <span className="font-mono text-[9px] text-neutral-600 uppercase tracking-widest">{label}</span>
              <span className={`font-mono text-xl font-black ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// ─── Interaction History Panel ──────────────────────────────────────────────
function HistoryPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showError } = useErrorModal();

  const INTENCION_COLORS = {
    CONSULTA:  { text: 'text-[#42ffe0]',  bg: 'bg-[#42ffe0]/10',  label: 'CONSULTA'  },
    PEDIDO:    { text: 'text-[#00ff66]',  bg: 'bg-[#00ff66]/10',  label: 'PEDIDO'    },
    RECLAMO:   { text: 'text-[#ff2d78]',  bg: 'bg-[#ff2d78]/10',  label: 'RECLAMO'   },
    ALERTA:    { text: 'text-[#ffa500]',  bg: 'bg-[#ffa500]/10',  label: 'ALERTA'    },
    ANALISIS:  { text: 'text-[#bf5af2]',  bg: 'bg-[#bf5af2]/10',  label: 'ANÁLISIS'  },
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/interactions?limit=30');
      setData(res.data);
    } catch (err) {
      showError(err.response?.data?.error || 'Error al cargar el historial.', 'Error Historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-3 text-[#bf5af2] font-mono text-sm">
      <Loader2 size={18} className="animate-spin" /> Cargando historial de interacciones...
    </div>
  );

  if (!data) return null;

  const { estadisticas, intenciones, interacciones } = data;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Interacciones', value: estadisticas?.total ?? 0, color: 'text-white' },
          ...(estadisticas?.por_agente ?? []).map(a => ({
            label: `Agente ${a.agente_tipo}`,
            value: a.total,
            color: a.agente_tipo === 'ADMIN' ? 'text-[#bf5af2]' : 'text-[#42ffe0]',
          })),
          { label: 'No Resueltos', value: (estadisticas?.por_agente ?? []).reduce((s, a) => s + (a.derivados || 0), 0), color: 'text-[#ff2d78]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#080808] rounded-xl p-3 border border-neutral-900">
            <span className="font-mono text-[9px] text-neutral-600 uppercase tracking-widest block mb-1">{label}</span>
            <span className={`font-mono text-2xl font-black ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Intent Breakdown */}
      {intenciones?.length > 0 && (
        <div className="bg-[#080808] rounded-xl p-4 border border-neutral-900">
          <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-3">Distribución de Intenciones Detectadas</p>
          <div className="flex flex-wrap gap-2">
            {intenciones.map(i => {
              const c = INTENCION_COLORS[i.intencion] || INTENCION_COLORS.CONSULTA;
              return (
                <div key={i.intencion} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${c.bg} ${c.text} border-current/20`}>
                  <span className="font-mono text-xs font-bold">{c.label}</span>
                  <span className="font-mono text-xs opacity-70">{i.total} ({i.porcentaje}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactions Table */}
      <div className="glass-card rounded-xl border border-[#bf5af2]/20 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#bf5af2]/10">
          <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest flex items-center gap-2">
            <History size={12} className="text-[#bf5af2]" /> Últimas {interacciones.length} interacciones guardadas
          </p>
          <button onClick={fetchHistory} className="text-neutral-600 hover:text-[#bf5af2] transition-colors">
            <RefreshCw size={13} />
          </button>
        </div>
        <div className="divide-y divide-neutral-900 max-h-[400px] overflow-y-auto">
          {interacciones.length === 0 ? (
            <p className="font-mono text-neutral-600 text-sm text-center py-10">No hay interacciones registradas todavía.</p>
          ) : interacciones.map(item => {
            const c = INTENCION_COLORS[item.intencion] || INTENCION_COLORS.CONSULTA;
            return (
              <div key={item.id} className="px-4 py-3 hover:bg-[#bf5af2]/5 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full border ${c.bg} ${c.text} border-current/20`}>{c.label}</span>
                    <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full ${
                      item.agente_tipo === 'ADMIN' ? 'bg-[#bf5af2]/10 text-[#bf5af2]' : 'bg-[#42ffe0]/10 text-[#42ffe0]'
                    }`}>{item.agente_tipo}</span>
                    {item.resuelto === 0 && (
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[#ff2d78]/10 text-[#ff2d78] flex items-center gap-1">
                        <XCircle size={9} /> Derivado
                      </span>
                    )}
                    {item.resuelto === 1 && (
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[#00ff66]/10 text-[#00ff66] flex items-center gap-1">
                        <CheckCircle size={9} /> Resuelto
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[9px] text-neutral-700 shrink-0">
                    {item.created_at?.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
                <p className="font-mono text-xs text-neutral-400 mt-1.5 truncate">
                  <MessageSquare size={10} className="inline mr-1 opacity-50" />
                  {item.usuario_nombre ? `[${item.usuario_nombre}]` : '[Admin]'} {item.mensaje_usuario}
                </p>
                {item.accion_tomada && (
                  <p className="font-mono text-[10px] text-neutral-700 mt-1">
                    ✓ {item.accion_tomada}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ─────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 max-w-[90%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
        isUser
          ? 'bg-[#ff2d78]/20 border border-[#ff2d78] text-[#ff2d78]'
          : 'bg-[#bf5af2]/20 border border-[#bf5af2] text-[#bf5af2]'
      }`}>
        {isUser ? <User size={16} /> : <BrainCircuit size={16} />}
      </div>
      <div className={`p-3 rounded-2xl text-sm font-sans ${
        isUser
          ? 'bg-[#ff2d78]/10 border border-[#ff2d78]/30 text-white rounded-tr-none'
          : 'bg-[#0a0a0a] border border-[#bf5af2]/30 text-neutral-200 rounded-tl-none shadow-[0_0_15px_#bf5af215]'
      }`}>
        {msg.role === 'ai' ? (
          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-neutral-800">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        ) : (
          msg.content
        )}
        {/* Metric panel for quick-action messages */}
        {msg.metricData && <MetricPanel data={msg.metricData} type={msg.metricType} />}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function AdminIAPage() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'history'
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: '⚡ **NEXUS online.** Soy tu agente analítico de negocio. Tengo acceso en tiempo real a los datos de retención, horas pico y engagement de todos tus clientes.\n\n**Cada consulta queda registrada automáticamente** en el historial de interacciones. ¿Qué métrica quieres analizar hoy? Usa los botones de consulta rápida o hazme una pregunta directamente.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [churnAlert, setChurnAlert] = useState(null); // Alerta de churn del servidor
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { showError } = useErrorModal();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', content: messageText }]);
    setInput('');
    setIsLoading(true);
    setChurnAlert(null);

    try {
      const res = await api.post('/ai/admin-chat', { message: messageText });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.reply }]);
      // Mostrar alerta de churn si el backend la detecta
      if (res.data.meta?.alerta_churn) {
        setChurnAlert(res.data.meta.alerta);
      }
    } catch (err) {
      showError(
        err.response?.data?.error || 'No se pudo contactar al agente NEXUS.',
        'Error NEXUS IA'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action) => {
    if (isLoading || loadingAction) return;
    setLoadingAction(action.id);

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: `${action.emoji} ${action.prompt}` }]);
    setIsLoading(true);

    try {
      // Fetch raw metric data in parallel with the AI chat
      const [chatRes, metricRes] = await Promise.all([
        api.post('/ai/admin-chat', { message: action.prompt }),
        api.get(action.endpoint).catch(() => null),
      ]);

      setMessages(prev => [...prev, {
        role: 'ai',
        content: chatRes.data.reply,
        metricData: metricRes?.data?.datos ?? null,
        metricType: action.id,
      }]);
    } catch (err) {
      showError(
        err.response?.data?.error || 'Error al procesar la consulta rápida.',
        'Error NEXUS IA'
      );
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-h-[850px] animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#bf5af2]/20">
        <div className="relative">
          <div className="absolute inset-0 bg-[#bf5af2]/30 rounded-full blur-[12px] pointer-events-none" />
          <BrainCircuit size={32} className="text-[#bf5af2] relative z-10 drop-shadow-[0_0_8px_#bf5af2]" />
        </div>
        <div>
          <h1 className="font-mono font-black text-2xl text-[#bf5af2]" style={{ textShadow: '0 0 12px #bf5af280' }}>
            NEXUS AI
          </h1>
          <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Agente Analítico de Negocio — Acceso Admin</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#bf5af2]/10 border border-[#bf5af2]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#bf5af2] animate-pulse" />
          <span className="font-mono text-[10px] text-[#bf5af2] uppercase tracking-widest">En línea</span>
        </div>
      </div>

      {/* Churn Alert Banner */}
      {churnAlert && (
        <div className="mb-3 flex items-start gap-2 px-4 py-3 rounded-xl bg-[#ff2d78]/10 border border-[#ff2d78]/30 animate-fade-in">
          <AlertTriangle size={16} className="text-[#ff2d78] shrink-0 mt-0.5" />
          <p className="font-mono text-xs text-[#ff2d78]">{churnAlert}</p>
          <button onClick={() => setChurnAlert(null)} className="ml-auto text-[#ff2d78]/50 hover:text-[#ff2d78]">
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* ─── Tabs ────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-3 p-1 bg-[#080808] rounded-xl border border-neutral-900">
        {[
          { id: 'chat',    label: 'Chat con NEXUS',      icon: BrainCircuit },
          { id: 'history', label: 'Historial Guardado',  icon: History },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-[#bf5af2]/15 text-[#bf5af2] border border-[#bf5af2]/30'
                : 'text-neutral-600 hover:text-neutral-400'
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─────────────────────────────────────── */}
      {activeTab === 'history' ? (
        <div className="flex-1 overflow-y-auto">
          <HistoryPanel />
        </div>
      ) : (
        <>
          {/* ─── Quick Actions ──────────────────────────────────── */}
          <div className="mb-3">
            <p className="font-mono text-[10px] text-neutral-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Zap size={10} className="text-[#bf5af2]" /> Consultas Rápidas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {QUICK_ACTIONS.map((action) => {
                const c = COLOR_MAP[action.color];
                const isActive = loadingAction === action.id;
                return (
                  <button
                    key={action.id}
                    id={`quick-action-${action.id}`}
                    onClick={() => handleQuickAction(action)}
                    disabled={isLoading || !!loadingAction}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border font-mono text-xs font-bold transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed ${c.bg} ${c.border} ${c.text} ${c.shadow} ${c.hoverBg} hover:shadow-lg`}
                  >
                    {isActive ? (
                      <Loader2 size={14} className="animate-spin shrink-0" />
                    ) : (
                      <action.icon size={14} className="shrink-0" />
                    )}
                    <span className="leading-tight">{action.emoji} {action.label}</span>
                    <ChevronRight size={12} className="ml-auto opacity-50" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Chat Messages ──────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto glass-card rounded-2xl border border-[#bf5af2]/20 p-4 mb-3 flex flex-col gap-4 shadow-[0_0_20px_#bf5af210] min-h-0">
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} msg={msg} />
            ))}
            {isLoading && !loadingAction && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#bf5af2]/20 border border-[#bf5af2] text-[#bf5af2]">
                  <BrainCircuit size={16} />
                </div>
                <div className="p-3 rounded-2xl text-sm font-mono bg-[#0a0a0a] border border-[#bf5af2]/30 text-[#bf5af2] rounded-tl-none flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  NEXUS procesando datos...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ─── Input Form ─────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre tus métricas, clientes, estrategia de negocio..."
              disabled={isLoading}
              className="flex-1 bg-[#080808] text-white font-sans text-sm border border-[#bf5af2]/30 rounded-xl px-4 py-3 outline-none focus:border-[#bf5af2] focus:ring-1 focus:ring-[#bf5af2]/30 transition-all disabled:opacity-50 placeholder:text-neutral-700"
            />
            <button
              type="submit"
              id="nexus-send-btn"
              disabled={!input.trim() || isLoading}
              className="bg-[#bf5af2]/10 text-[#bf5af2] border border-[#bf5af2] hover:bg-[#bf5af2]/25 transition-all px-4 py-3 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_#bf5af233]"
            >
              <Send size={20} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}

