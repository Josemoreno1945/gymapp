import { useState, useEffect } from 'react';
import Header from '../components/Header';
import api from '../api/client';

export default function AdminPage() {
  const [retention, setRetention] = useState(null);
  const [peakHours, setPeakHours] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const [retRes, peakRes, engRes] = await Promise.all([
        api.get('/ai/retention'),
        api.get('/ai/peak-hours'),
        api.get('/ai/engagement')
      ]);
      setRetention(retRes.data.datos);
      setPeakHours(peakRes.data.datos);
      setEngagement(engRes.data.datos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-[#ff2d78] font-mono text-xl animate-pulse-neon">Cargando métricas de IA...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        
        <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
          <h1 className="font-mono font-black text-2xl text-[#ff2d78] text-glow-pink">Admin Dashboard</h1>
          <span className="font-mono text-xs bg-[#ff2d78]/10 text-[#ff2d78] px-3 py-1 rounded-full border border-[#ff2d78]/30">AI Business Metrics</span>
        </div>

        {/* Retention & Churn */}
        <section className="glass-card rounded-xl p-6 border border-neutral-900 neon-glow-pink" style={{ boxShadow: '0 0 1px #ff2d7833' }}>
          <h2 className="font-mono font-bold text-[#ff2d78] mb-6">Retención y Churn</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Usuarios Totales" value={retention?.resumen?.total_usuarios} color="white" />
            <MetricCard label="Activos" value={retention?.resumen?.activos} color="green" />
            <MetricCard label="En Riesgo" value={retention?.resumen?.en_riesgo} color="cyan" />
            <MetricCard label="Abandonados" value={retention?.resumen?.abandonados} color="pink" />
          </div>

          <div className="bg-[#050505] rounded-lg p-4 border border-neutral-900">
            <h3 className="font-mono text-xs text-neutral-500 mb-2 uppercase">Recomendaciones de la IA</h3>
            <ul className="list-disc list-inside space-y-2">
              {retention?.recomendaciones?.map((rec, i) => (
                <li key={i} className="font-sans text-sm text-neutral-300">{rec}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Peak Hours */}
        <section className="glass-card rounded-xl p-6 border border-neutral-900">
          <h2 className="font-mono font-bold text-[#42ffe0] mb-6">Horas Pico de Uso</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <MetricCard label="Hora Pico Absoluta" value={`${peakHours?.hora_pico?.hora}:00`} sub={`${peakHours?.hora_pico?.pct_del_total}% del uso`} color="cyan" />
            <MetricCard label="Franja Tarde" value={peakHours?.franjas?.tarde_12_18} sub="registros (12-18h)" color="white" />
            <MetricCard label="Franja Noche" value={peakHours?.franjas?.noche_18_24} sub="registros (18-24h)" color="white" />
          </div>

          <div className="bg-[#050505] rounded-lg p-4 border border-neutral-900">
            <h3 className="font-mono text-xs text-neutral-500 mb-2 uppercase">Recomendaciones de la IA</h3>
            <ul className="list-disc list-inside space-y-2">
              {peakHours?.recomendaciones?.map((rec, i) => (
                <li key={i} className="font-sans text-sm text-neutral-300">{rec}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Engagement */}
        <section className="glass-card rounded-xl p-6 border border-neutral-900">
          <h2 className="font-mono font-bold text-[#bf5af2] mb-6">Índice de Enganche (Engagement)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#0a0a0a] p-5 rounded-lg border border-neutral-800 flex flex-col items-center justify-center">
              <span className="font-mono text-xs text-neutral-500 uppercase mb-2">Score Global (0-100)</span>
              <span className="font-mono text-4xl font-bold text-[#bf5af2] drop-shadow-[0_0_8px_#bf5af2]">{engagement?.engagement_grupal?.score_promedio}</span>
              <span className="font-mono text-sm text-[#bf5af2] uppercase mt-2">{engagement?.engagement_grupal?.clasificacion}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Excepcional" value={engagement?.distribucion?.excepcional_80_100} color="green" />
              <MetricCard label="Alto" value={engagement?.distribucion?.alto_60_80} color="cyan" />
              <MetricCard label="Medio" value={engagement?.distribucion?.medio_40_60} color="white" />
              <MetricCard label="Bajo" value={engagement?.distribucion?.bajo_0_40} color="pink" />
            </div>
          </div>

          <div className="bg-[#050505] rounded-lg p-4 border border-neutral-900">
            <h3 className="font-mono text-xs text-neutral-500 mb-2 uppercase">Recomendaciones de la IA</h3>
            <ul className="list-disc list-inside space-y-2">
              {engagement?.recomendaciones?.map((rec, i) => (
                <li key={i} className="font-sans text-sm text-neutral-300">{rec}</li>
              ))}
            </ul>
          </div>
        </section>

      </main>
    </div>
  );
}

function MetricCard({ label, value, sub, color }) {
  const colors = {
    green: 'text-[#00ff66]',
    cyan:  'text-[#42ffe0]',
    pink:  'text-[#ff2d78]',
    white: 'text-white'
  };

  return (
    <div className="bg-[#050505] p-4 rounded-lg border border-neutral-900 flex flex-col">
      <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">{label}</span>
      <span className={`font-mono text-2xl font-bold mt-1 ${colors[color]}`}>{value ?? '-'}</span>
      {sub && <span className="font-mono text-[10px] text-neutral-600 mt-1">{sub}</span>}
    </div>
  );
}
