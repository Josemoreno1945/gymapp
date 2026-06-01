import { useState, useEffect } from 'react';
import { Activity, ChevronDown } from 'lucide-react';
import api from '../api/client';
import StatisticsView from '../components/StatisticsView';

export default function MetricasPage() {
  const [ejercicios, setEjercicios] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    fetchEjercicios();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchProgress(selectedId);
    } else {
      setChartData([]);
    }
  }, [selectedId]);

  const fetchEjercicios = async () => {
    try {
      const res = await api.get('/ejercicios');
      // Sort alphabetically for easier selection
      const sorted = res.data.ejercicios.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setEjercicios(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async (id) => {
    setLoadingProgress(true);
    try {
      const res = await api.get(`/ejercicios/${id}/progreso`);
      setChartData(res.data.progreso);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProgress(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex items-center gap-4 border-b border-neutral-900 pb-4">
        <Activity size={32} className="text-[#ff2d78] drop-shadow-[0_0_12px_#ff2d78]" />
        <div>
          <h1 className="font-mono font-black text-2xl text-[#ff2d78] text-glow-pink">Métricas y Rendimiento</h1>
          <p className="font-mono text-xs text-neutral-500 mt-1">Análisis de evolución de fuerza por semana.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 font-mono text-[#ff2d78] animate-pulse">Cargando catálogo...</div>
      ) : ejercicios.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-xl border border-neutral-900">
          <p className="font-mono text-neutral-500 text-sm">No tienes ejercicios creados. Ve al catálogo para agregarlos.</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl border border-neutral-900 overflow-hidden p-5 relative">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#ff2d78]/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="mb-6 relative">
            <label className="block font-mono text-xs text-[#ff2d78] uppercase mb-2 font-bold tracking-wider">Selecciona un Ejercicio</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full min-h-[44px] bg-[#050505] text-white font-mono text-sm
                border border-neutral-800 rounded-lg px-4 appearance-none outline-none transition-colors
                focus:border-[#ff2d78] focus:ring-1 focus:ring-[#ff2d78]/40 cursor-pointer"
            >
              <option value="">-- Ningún ejercicio seleccionado --</option>
              {ejercicios.map(ej => (
                <option key={ej.id} value={ej.id}>
                  {ej.nombre}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-[38px] pointer-events-none text-[#ff2d78]">
              <ChevronDown size={16} />
            </div>
          </div>

          {!selectedId ? (
            <div className="h-64 flex items-center justify-center text-neutral-600 font-mono text-sm text-center px-4 border border-dashed border-neutral-800 rounded-lg bg-neutral-950">
              Selecciona un ejercicio arriba para visualizar su progreso semanal.
            </div>
          ) : loadingProgress ? (
            <div className="h-64 flex items-center justify-center text-[#ff2d78] font-mono text-sm text-center px-4 animate-pulse">
              Calculando métricas...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-neutral-600 font-mono text-sm text-center px-4 border border-dashed border-neutral-800 rounded-lg bg-neutral-950">
              Aún no tienes registros de series para este ejercicio en tus semanas.
            </div>
          ) : (
            <StatisticsView data={chartData} />
          )}
        </div>
      )}
    </div>
  );
}
