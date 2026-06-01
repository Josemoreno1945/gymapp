import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Trash2, ChevronRight, Calendar } from 'lucide-react';
import api from '../api/client';
import ConfirmModal from '../components/ConfirmModal';
import { useErrorModal } from '../context/ErrorModalContext';

export default function SemanasPage() {
  const [semanas, setSemanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const { showError } = useErrorModal();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSemanas();
  }, []);

  const fetchSemanas = async () => {
    try {
      const res = await api.get('/semanas');
      setSemanas(res.data.semanas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const autoNombre = `Semana ${semanas.length + 1}`;
    try {
      const res = await api.post('/semanas', { nombre: autoNombre });
      setSemanas([res.data.semana, ...semanas]);
    } catch (err) {
      console.error(err);
      showError(
        err.serverMessage || 'No se pudo crear la semana. Intenta nuevamente.',
        'Error al crear semana'
      );
    }
  };

  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = deleteModal.id;
    if (!id) return;
    
    try {
      await api.delete(`/semanas/${id}`);
      setSemanas(semanas.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
      showError(
        err.serverMessage || 'No se pudo eliminar la semana. Intenta nuevamente.',
        'Error al eliminar'
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-mono font-black text-2xl text-[#00ff66] text-glow-green">Mis Semanas</h1>
          <p className="font-mono text-xs text-neutral-500 mt-1">Organiza tu entrenamiento en bloques semanales.</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66] px-4 py-2 rounded-lg font-mono text-sm uppercase tracking-wider hover:bg-[#00ff66]/20 transition-all hover:shadow-[0_0_15px_#00ff6644] active:scale-95"
        >
          <CalendarPlus size={18} />
          <span>Nueva Semana</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 font-mono text-[#00ff66] animate-pulse">Cargando semanas...</div>
      ) : semanas.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-xl border border-neutral-900 flex flex-col items-center gap-4">
          <Calendar size={48} className="text-neutral-700" />
          <p className="font-mono text-neutral-500 text-sm">No tienes ninguna semana registrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {semanas.map((sem) => (
            <div
              key={sem.id}
              onClick={() => navigate(`/dashboard/semanas/${sem.id}`)}
              className="glass-card p-5 rounded-xl border border-neutral-800 hover:border-[#00ff66]/50 hover:shadow-[0_0_15px_#00ff6622] cursor-pointer transition-all group flex flex-col justify-between min-h-[140px]"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-mono font-bold text-white text-lg group-hover:text-[#00ff66] transition-colors line-clamp-2 pr-2">{sem.nombre}</h3>
                  <button
                    onClick={(e) => handleDeleteClick(sem.id, e)}
                    className="text-neutral-600 hover:text-[#ff2d78] transition-colors p-1"
                    title="Eliminar semana"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="font-mono text-xs text-neutral-500">
                  {sem.total_dias || 0} {(sem.total_dias === 1) ? 'día' : 'días'} registrado(s)
                </p>
                <p className="font-mono text-[10px] text-neutral-700 mt-2">
                  Creada: {new Date(sem.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex justify-end mt-4">
                <ChevronRight className="text-neutral-600 group-hover:text-[#00ff66] group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Semana"
        message="¿Seguro que quieres eliminar esta semana y todos sus días? Esta acción no se puede deshacer."
      />
    </div>
  );
}
