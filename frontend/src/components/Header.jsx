import { useState, useEffect } from 'react';
import { Dumbbell, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Header({ unit, onToggleUnit }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [totalVol, setTotalVol] = useState(0);

  useEffect(() => {
    // Only fetch volume if we are showing it
    if (!onToggleUnit) return; 
    
    api.get('/training/stats').then(res => {
      setTotalVol(res.data.estadisticas.volumen_total || 0);
    }).catch(err => console.error(err));
  }, [unit]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-neutral-900">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">

        {/* Brand */}
        <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => navigate('/dashboard/semanas')}>
          <Dumbbell className="text-[#00ff66] drop-shadow-[0_0_6px_#00ff66]" size={22} />
          <span className="font-mono font-black text-xl text-[#00ff66] text-glow-green tracking-tight hidden sm:inline-block">
            Neon<span className="text-[#42ffe0] text-glow-cyan">Bench</span>
          </span>
        </div>

        {/* User area */}
        <div className="flex items-center gap-4">
          
          {user?.rol === 'ADMIN' && (
            <button
              onClick={() => navigate('/admin')}
              className="font-mono text-xs text-[#ff2d78] hover:text-white transition-colors uppercase tracking-widest border border-[#ff2d78]/30 hover:border-[#ff2d78] px-3 py-1.5 rounded-md"
            >
              Admin Panel
            </button>
          )}

          <div className="flex flex-col items-end">
            <span className="font-mono text-xs text-white">{user?.nombre}</span>
            <span className="font-mono text-[9px] text-neutral-500 uppercase">{user?.rol}</span>
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="text-neutral-500 hover:text-[#ff2d78] transition-colors p-2"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
