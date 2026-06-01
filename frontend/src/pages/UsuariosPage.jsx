import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, RefreshCw, Shield, User } from 'lucide-react';
import api from '../api/client';
import { useErrorModal } from '../context/ErrorModalContext';

function StatusBadge({ activo }) {
  return activo ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30">
      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-[#ff2d78]/10 text-[#ff2d78] border border-[#ff2d78]/30">
      <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d78]" />
      Inactivo
    </span>
  );
}

function RolBadge({ rol }) {
  return rol === 'ADMIN' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#ff2d78]/10 text-[#ff2d78] border border-[#ff2d78]/20">
      <Shield size={10} /> Admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
      <User size={10} /> Cliente
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, activos: 0, admins: 0 });
  const { showError } = useErrorModal();

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users?limit=100');
      const list = res.data.usuarios || [];
      setUsuarios(list);
      setStats({
        total: list.length,
        activos: list.filter(u => u.activo).length,
        admins: list.filter(u => u.rol === 'ADMIN').length,
      });
    } catch (err) {
      showError('No se pudo cargar la lista de usuarios.', 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ff2d78]/10 rounded-xl border border-[#ff2d78]/20">
            <Users size={22} className="text-[#ff2d78] drop-shadow-[0_0_6px_#ff2d78]" />
          </div>
          <div>
            <h1 className="font-mono font-black text-2xl text-[#ff2d78]">Gestión de Usuarios</h1>
            <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Panel de Administrador</p>
          </div>
        </div>
        <button
          onClick={fetchUsuarios}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-[#42ffe0] hover:border-[#42ffe0]/30 font-mono text-xs transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Usuarios', value: stats.total, icon: Users, color: 'white' },
          { label: 'Activos', value: stats.activos, icon: UserCheck, color: 'green' },
          { label: 'Administradores', value: stats.admins, icon: Shield, color: 'pink' },
        ].map(({ label, value, icon: Icon, color }) => {
          const colorMap = {
            white: 'text-white',
            green: 'text-[#00ff66]',
            pink: 'text-[#ff2d78]',
          };
          return (
            <div key={label} className="glass-card rounded-xl p-4 border border-neutral-900 flex flex-col gap-1">
              <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">{label}</span>
              <span className={`font-mono text-3xl font-black ${colorMap[color]}`}>{loading ? '—' : value}</span>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-neutral-900 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-[#ff2d78] font-mono text-sm animate-pulse">Cargando usuarios...</div>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-600">
              <Users size={40} />
              <p className="font-mono text-sm">No hay usuarios registrados</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-900 bg-[#050505]">
                  {['ID', 'Nombre', 'Email', 'Rol', 'Registro', 'Estado'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-b border-neutral-900/50 transition-colors hover:bg-neutral-900/30 ${
                      i % 2 === 0 ? 'bg-transparent' : 'bg-[#050505]/30'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600">#{u.id}</td>
                    <td className="px-4 py-3 font-sans text-sm text-white font-medium">{u.nombre}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-400">{u.email}</td>
                    <td className="px-4 py-3"><RolBadge rol={u.rol} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge activo={u.activo} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
