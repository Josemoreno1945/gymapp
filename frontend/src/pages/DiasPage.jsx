import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import api from '../api/client';
import ConfirmModal from '../components/ConfirmModal';
import { useErrorModal } from '../context/ErrorModalContext';

export default function DiasPage() {
  const { id: semanaId } = useParams();
  const navigate = useNavigate();
  const { showError } = useErrorModal();

  const [semana, setSemana] = useState(null);
  const [dias, setDias] = useState([]);
  const [ejerciciosCatalog, setEjerciciosCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isCreatingDia, setIsCreatingDia] = useState(false);
  const [nuevoDia, setNuevoDia] = useState('');

  // States for adding exercise to a day
  const [activeDiaId, setActiveDiaId] = useState(null);
  const [selectedEjercicio, setSelectedEjercicio] = useState('');
  const [series, setSeries] = useState(3);
  const [reps, setReps] = useState(10);
  const [peso, setPeso] = useState(0);

  // Modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchData();
  }, [semanaId]);

  const fetchData = async () => {
    try {
      const [diasRes, catalogRes] = await Promise.all([
        api.get(`/semanas/${semanaId}/dias`),
        api.get('/ejercicios')
      ]);
      setSemana(diasRes.data.semana);
      
      const diasLoaded = diasRes.data.dias;
      const diasWithEjercicios = await Promise.all(diasLoaded.map(async (dia) => {
        const ejRes = await api.get(`/dias/${dia.id}/ejercicios`);
        return { ...dia, ejerciciosAsignados: ejRes.data.ejercicios };
      }));

      setDias(diasWithEjercicios);
      setEjerciciosCatalog(catalogRes.data.ejercicios);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) navigate('/dashboard/semanas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDia = async (e) => {
    e.preventDefault();
    if (!nuevoDia.trim()) return;
    try {
      const res = await api.post(`/semanas/${semanaId}/dias`, { nombre: nuevoDia.trim(), orden: dias.length + 1 });
      setDias([...dias, { ...res.data.dia, ejerciciosAsignados: [] }]);
      setNuevoDia('');
      setIsCreatingDia(false);
    } catch (err) {
      console.error(err);
      showError(
        err.serverMessage || 'No se pudo crear el día. Intenta nuevamente.',
        'Error al crear día'
      );
    }
  };

  const handleDeleteDiaClick = (diaId) => {
    setDeleteModal({ isOpen: true, id: diaId });
  };

  const handleConfirmDeleteDia = async () => {
    const diaId = deleteModal.id;
    if (!diaId) return;

    try {
      await api.delete(`/dias/${diaId}`);
      setDias(dias.filter(d => d.id !== diaId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEjercicio = async (e, diaId) => {
    e.preventDefault();
    if (!selectedEjercicio) {
      showError('Debes seleccionar un ejercicio antes de continuar.', 'Ejercicio requerido');
      return;
    }
    
    try {
      const res = await api.post(`/dias/${diaId}/ejercicios`, {
        ejercicio_id: parseInt(selectedEjercicio),
        series: parseInt(series),
        repeticiones: parseInt(reps),
        peso: parseFloat(peso)
      });
      
      setDias(dias.map(d => {
        if (d.id === diaId) {
          const ejName = ejerciciosCatalog.find(c => c.id === parseInt(selectedEjercicio))?.nombre;
          return {
            ...d,
            ejerciciosAsignados: [...d.ejerciciosAsignados, { ...res.data.dia_ejercicio, ejercicio_nombre: ejName }]
          };
        }
        return d;
      }));
      
      setActiveDiaId(null);
      setSelectedEjercicio('');
      setSeries(3);
      setReps(10);
      setPeso(0);
    } catch (err) {
      console.error(err);
      showError(
        err.serverMessage || 'No se pudo asignar el ejercicio. Intenta nuevamente.',
        'Error al asignar'
      );
    }
  };

  const handleDeleteAsignacion = async (diaId, asignacionId) => {
    try {
      await api.delete(`/dia-ejercicios/${asignacionId}`);
      setDias(dias.map(d => {
        if (d.id === diaId) {
          return { ...d, ejerciciosAsignados: d.ejerciciosAsignados.filter(e => e.id !== asignacionId) };
        }
        return d;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center py-20 font-mono text-[#00ff66] animate-pulse">Cargando días...</div>;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20">
      <div className="flex items-center gap-4 border-b border-neutral-900 pb-4">
        <button onClick={() => navigate('/dashboard/semanas')} className="text-neutral-500 hover:text-[#00ff66] transition-colors p-1">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="font-mono font-black text-2xl text-white">{semana?.nombre}</h1>
          <p className="font-mono text-xs text-neutral-500 mt-1">Gestión de días y rutinas de esta semana</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {dias.map((dia) => (
          <div key={dia.id} className="glass-card rounded-xl border border-neutral-800 overflow-hidden flex flex-col neon-glow-cyan" style={{ boxShadow: '0 0 1px #42ffe022' }}>
            <div className="bg-[#050505] p-4 flex justify-between items-center border-b border-neutral-900">
              <h2 className="font-mono font-bold text-[#42ffe0] text-glow-cyan text-lg">{dia.nombre}</h2>
              <button onClick={() => handleDeleteDiaClick(dia.id)} className="text-neutral-600 hover:text-[#ff2d78] transition-colors p-1">
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="p-4 flex-1 flex flex-col gap-3 max-h-[400px] overflow-y-auto">
              {dia.ejerciciosAsignados?.length === 0 ? (
                <p className="font-mono text-xs text-neutral-600 text-center py-6">No hay ejercicios asignados</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {dia.ejerciciosAsignados?.map(ej => (
                    <div key={ej.id} className="flex justify-between items-center bg-black/40 border border-neutral-900 p-3 rounded-lg hover:border-[#bf5af2]/50 transition-colors group">
                      <div>
                        <p className="font-sans font-bold text-white text-sm">{ej.ejercicio_nombre}</p>
                        <p className="font-mono text-[10px] text-neutral-500 mt-1 uppercase tracking-wider">
                          <span className="text-[#00ff66] font-bold">{ej.series}</span>s × <span className="text-[#42ffe0] font-bold">{ej.repeticiones}</span>r @ <span className="text-[#ff2d78] font-bold">{ej.peso}</span>{ej.unidad}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteAsignacion(dia.id, ej.id)} className="text-neutral-700 hover:text-[#ff2d78] transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-neutral-900 bg-neutral-950/50">
              {activeDiaId === dia.id ? (
                <form onSubmit={(e) => handleAddEjercicio(e, dia.id)} className="flex flex-col gap-3 animate-slide-in">
                  <select
                    value={selectedEjercicio}
                    onChange={(e) => setSelectedEjercicio(e.target.value)}
                    required
                    className="w-full bg-[#050505] text-white font-mono text-sm border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-[#42ffe0] focus:ring-1 focus:ring-[#42ffe0]/40"
                  >
                    <option value="">-- Seleccionar Ejercicio --</option>
                    {ejerciciosCatalog.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-mono text-[10px] text-neutral-500 uppercase mb-1">Series</label>
                      <input type="number" min="1" value={series} onChange={e => setSeries(e.target.value)} required className="w-full bg-[#050505] text-white font-mono text-sm border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-[#00ff66]" />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-neutral-500 uppercase mb-1">Reps</label>
                      <input type="number" min="1" value={reps} onChange={e => setReps(e.target.value)} required className="w-full bg-[#050505] text-white font-mono text-sm border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-[#42ffe0]" />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-neutral-500 uppercase mb-1">Peso</label>
                      <input type="number" min="0" step="0.5" value={peso} onChange={e => setPeso(e.target.value)} required className="w-full bg-[#050505] text-white font-mono text-sm border border-neutral-800 rounded-lg px-3 py-2 outline-none focus:border-[#ff2d78]" />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-1">
                    <button type="submit" className="flex-1 bg-[#42ffe0]/10 text-[#42ffe0] border border-[#42ffe0] rounded-lg font-mono text-xs py-2 uppercase font-bold hover:bg-[#42ffe0]/20 transition-all">
                      Agregar
                    </button>
                    <button type="button" onClick={() => setActiveDiaId(null)} className="flex-1 border border-neutral-800 text-neutral-400 rounded-lg font-mono text-xs py-2 uppercase hover:bg-neutral-900 transition-all">
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setActiveDiaId(dia.id)}
                  className="w-full flex items-center justify-center gap-2 font-mono text-xs text-neutral-400 uppercase tracking-widest py-2.5 border border-dashed border-neutral-800 rounded-lg hover:border-[#42ffe0]/50 hover:text-[#42ffe0] hover:bg-[#42ffe0]/5 transition-colors"
                >
                  <Plus size={14} /> Asignar Ejercicio
                </button>
              )}
            </div>
          </div>
        ))}

        {isCreatingDia ? (
          <form onSubmit={handleCreateDia} className="glass-card rounded-xl border border-[#00ff66]/40 p-5 flex flex-col justify-center h-full min-h-[250px] gap-3">
            <label className="font-mono text-xs text-[#00ff66] uppercase">Nombre del Día</label>
            <input
              type="text"
              value={nuevoDia}
              onChange={e => setNuevoDia(e.target.value)}
              placeholder="Ej: Día 1 - Empuje"
              autoFocus
              required
              className="w-full bg-[#050505] text-white font-mono text-sm border border-neutral-800 rounded-lg px-4 py-3 outline-none focus:border-[#00ff66] focus:ring-1 focus:ring-[#00ff66]/40 transition-colors"
            />
            <div className="flex gap-2 mt-3">
              <button type="submit" className="flex-1 bg-[#00ff66] text-black font-bold font-mono text-sm py-2.5 rounded-lg hover:bg-[#00ff66]/90 shadow-[0_0_10px_#00ff6688] transition-all">
                Guardar
              </button>
              <button type="button" onClick={() => setIsCreatingDia(false)} className="flex-1 border border-neutral-800 text-neutral-400 font-mono text-sm py-2.5 rounded-lg hover:bg-neutral-900 hover:text-white transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreatingDia(true)}
            className="rounded-xl border-2 border-dashed border-neutral-800 hover:border-[#00ff66]/50 hover:bg-[#00ff66]/5 flex flex-col items-center justify-center h-full min-h-[250px] gap-4 transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-neutral-900 group-hover:bg-[#00ff66]/20 flex items-center justify-center text-neutral-500 group-hover:text-[#00ff66] transition-all group-hover:scale-110">
              <Plus size={28} />
            </div>
            <span className="font-mono text-sm text-neutral-500 group-hover:text-[#00ff66] uppercase tracking-wider">Crear Nuevo Día</span>
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={handleConfirmDeleteDia}
        title="Eliminar Día"
        message="¿Seguro que quieres eliminar este día y todos sus ejercicios asignados? Esta acción no se puede deshacer."
      />
    </div>
  );
}
