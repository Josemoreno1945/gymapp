import { useState, useEffect } from 'react';
import Header from '../components/Header';
import SmartInput from '../components/SmartInput';
import EntryCard from '../components/EntryCard';
import StatisticsView from '../components/StatisticsView';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useErrorModal } from '../context/ErrorModalContext';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { showError } = useErrorModal();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      // Fetch 100 recent logs
      const res = await api.get('/training/logs?limit=100');
      setLogs(res.data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogCreated = (newLog) => {
    setLogs([newLog, ...logs]);
  };

  const handleDeleteLog = async (id) => {
    try {
      await api.delete(`/training/logs/${id}`);
      setLogs(logs.filter(l => l.id !== id));
    } catch (err) {
      console.error(err);
      showError(
        err.serverMessage || 'No se pudo eliminar el registro. Intenta nuevamente.',
        'Error al eliminar'
      );
    }
  };

  // Group logs by day (YYYY-MM-DD)
  const groupedLogs = logs.reduce((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div className="min-h-screen text-white bg-black">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ── Quick Input Panel ── */}
        <section className="glass-card rounded-xl border border-neutral-900 overflow-hidden p-5">
          <h2 className="font-mono font-bold text-[#42ffe0] text-sm text-glow-cyan mb-4 flex items-center gap-2">
            <Plus size={16} /> Agregar Ejercicio
          </h2>
          <SmartInput onLogCreated={handleLogCreated} />
        </section>

        {/* ── Statistics Panel ── */}
        <StatisticsView logs={logs} />

        {/* ── Logs List Grouped by Date ── */}
        <section className="flex flex-col gap-6 mt-4">
          {loading ? (
            <div className="text-center text-neutral-500 font-mono text-sm py-10">Cargando entrenamientos...</div>
          ) : Object.keys(groupedLogs).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="text-6xl animate-pulse-neon">🏋️</div>
              <p className="font-mono text-neutral-600 text-sm text-center">
                Aún no tienes entrenamientos.<br />
                <span className="text-[#00ff66]">Registra tu primer ejercicio arriba.</span>
              </p>
            </div>
          ) : (
            Object.entries(groupedLogs).map(([date, dayLogs]) => {
              const dayVolume = dayLogs.reduce((acc, l) => acc + l.volumen, 0);
              return (
                <div key={date} className="glass-card rounded-xl border border-neutral-900 overflow-hidden neon-glow-green" style={{ boxShadow: '0 0 1px #00ff6622' }}>
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-900 bg-gradient-to-r from-[#00ff6608] to-transparent">
                    <h3 className="font-mono font-bold text-[#00ff66] text-sm text-glow-green capitalize">
                      {date}
                    </h3>
                    <span className="text-[10px] font-mono text-neutral-600">
                      vol <span className="text-[#bf5af2]">{dayVolume.toFixed(0)}</span>
                    </span>
                  </div>
                  
                  <div className="px-4 py-3 flex flex-col gap-1.5">
                    {dayLogs.map((log) => (
                      <EntryCard
                        key={log.id}
                        entry={log}
                        onDelete={handleDeleteLog}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </section>

      </main>
    </div>
  );
}
