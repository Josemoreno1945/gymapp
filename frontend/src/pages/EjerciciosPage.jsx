import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Dumbbell } from 'lucide-react';
import api from '../api/client';
import ConfirmModal from '../components/ConfirmModal';
import { useErrorModal } from '../context/ErrorModalContext';

export default function EjerciciosPage() {
  const [ejercicios, setEjercicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useErrorModal();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, nombre: '', grupo_muscular: '', notas: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  useEffect(() => {
    fetchEjercicios();
  }, []);

  const fetchEjercicios = async () => {
    try {
      const res = await api.get('/ejercicios');
      setEjercicios(res.data.ejercicios);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (ej = null) => {
    if (ej) {
      setFormData(ej);
    } else {
      setFormData({ id: null, nombre: '', grupo_muscular: '', notas: '' });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    try {
      if (formData.id) {
        const res = await api.put(`/ejercicios/${formData.id}`, formData);
        setEjercicios(ejercicios.map(e => e.id === formData.id ? res.data.ejercicio : e));
      } else {
        const res = await api.post('/ejercicios', formData);
        setEjercicios([...ejercicios, res.data.ejercicio].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      showError(
        err.serverMessage || 'No se pudo guardar el ejercicio. Intenta nuevamente.',
        'Error al guardar'
      );
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteModal({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = deleteModal.id;
    if (!id) return;
    
    try {
      await api.delete(`/ejercicios/${id}`);
      setEjercicios(ejercicios.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-mono font-black text-2xl text-[#bf5af2] text-glow-purple">Catálogo de Ejercicios</h1>
          <p className="font-mono text-xs text-neutral-500 mt-1">Gestiona los ejercicios disponibles para tus rutinas.</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center justify-center gap-2 bg-[#bf5af2]/10 text-[#bf5af2] border border-[#bf5af2] px-4 py-2 rounded-lg font-mono text-sm uppercase tracking-wider hover:bg-[#bf5af2]/20 transition-all hover:shadow-[0_0_15px_#bf5af244] active:scale-95"
        >
          <Plus size={18} />
          <span>Nuevo Ejercicio</span>
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="glass-card p-5 rounded-xl border border-[#bf5af2]/50 mb-2 animate-slide-in shadow-[0_0_20px_#bf5af222]">
          <h3 className="font-mono font-bold text-[#bf5af2] uppercase text-sm mb-4">
            {formData.id ? 'Editar Ejercicio' : 'Crear Ejercicio'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-mono text-[10px] text-neutral-400 uppercase mb-1">Nombre *</label>
              <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required className="w-full bg-[#050505] text-white font-sans text-sm border border-neutral-800 rounded-lg px-4 py-2.5 outline-none focus:border-[#bf5af2]" placeholder="Ej: Press de Banca" />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-neutral-400 uppercase mb-1">Grupo Muscular</label>
              <input type="text" value={formData.grupo_muscular || ''} onChange={e => setFormData({...formData, grupo_muscular: e.target.value})} className="w-full bg-[#050505] text-white font-sans text-sm border border-neutral-800 rounded-lg px-4 py-2.5 outline-none focus:border-[#bf5af2]" placeholder="Ej: Pecho, Pierna, etc." />
            </div>
          </div>
          <div className="mb-5">
            <label className="block font-mono text-[10px] text-neutral-400 uppercase mb-1">Notas / Enlaces</label>
            <input type="text" value={formData.notas || ''} onChange={e => setFormData({...formData, notas: e.target.value})} className="w-full bg-[#050505] text-white font-sans text-sm border border-neutral-800 rounded-lg px-4 py-2.5 outline-none focus:border-[#bf5af2]" placeholder="Tips técnicos o link a video de ejecución" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsFormOpen(false)} className="border border-neutral-800 text-neutral-400 hover:text-white px-4 py-2 rounded-lg font-mono text-sm transition-colors">Cancelar</button>
            <button type="submit" className="bg-[#bf5af2] text-black font-bold font-mono text-sm px-6 py-2 rounded-lg hover:bg-[#bf5af2]/90 shadow-[0_0_10px_#bf5af288] transition-all">Guardar</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-20 font-mono text-[#bf5af2] animate-pulse">Cargando ejercicios...</div>
      ) : ejercicios.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-xl border border-neutral-900 flex flex-col items-center gap-4">
          <Dumbbell size={48} className="text-neutral-700" />
          <p className="font-mono text-neutral-500 text-sm">No tienes ejercicios en tu catálogo.<br/><span className="text-[#bf5af2]">Agrega uno para empezar.</span></p>
        </div>
      ) : (
        <div className="glass-card rounded-xl border border-neutral-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#050505] border-b border-neutral-800">
                  <th className="py-4 px-5 font-mono text-[10px] uppercase text-neutral-500 tracking-wider">Nombre</th>
                  <th className="py-4 px-5 font-mono text-[10px] uppercase text-neutral-500 tracking-wider hidden sm:table-cell">Grupo Muscular</th>
                  <th className="py-4 px-5 font-mono text-[10px] uppercase text-neutral-500 tracking-wider hidden md:table-cell">Notas</th>
                  <th className="py-4 px-5 font-mono text-[10px] uppercase text-neutral-500 tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ejercicios.map((ej) => (
                  <tr key={ej.id} className="border-b border-neutral-900/50 hover:bg-neutral-900/40 transition-colors group">
                    <td className="py-3 px-5 font-sans font-bold text-white text-sm group-hover:text-[#bf5af2] transition-colors">{ej.nombre}</td>
                    <td className="py-3 px-5 font-mono text-xs text-[#bf5af2]/80 hidden sm:table-cell">{ej.grupo_muscular || '—'}</td>
                    <td className="py-3 px-5 font-sans text-xs text-neutral-500 hidden md:table-cell truncate max-w-[200px]">{ej.notas || '—'}</td>
                    <td className="py-3 px-5 flex justify-end gap-1">
                      <button onClick={() => handleOpenForm(ej)} className="p-2 text-neutral-600 hover:text-[#42ffe0] transition-colors rounded hover:bg-[#42ffe0]/10"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteClick(ej.id)} className="p-2 text-neutral-600 hover:text-[#ff2d78] transition-colors rounded hover:bg-[#ff2d78]/10"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Ejercicio"
        message="¿Seguro que quieres eliminar este ejercicio? Se borrará de todas tus rutinas y no podrás recuperarlo."
      />
    </div>
  );
}
